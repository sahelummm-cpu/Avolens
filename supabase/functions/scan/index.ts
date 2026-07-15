// AI meal scan — Supabase Edge Function twin of the web app's /api/scan.
// Modes: 'meal' (photo of a plate), 'label' (photo of a nutrition-facts
// label, read exactly), 'voice' (spoken description as text, no image).
// Requires the ANTHROPIC_API_KEY secret:
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// Callers must be signed-in users (the anon key alone is rejected) and are
// rate-limited per day via increment_ai_usage() (see the ai_usage migration).
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const DAILY_LIMIT = 50; // AI scans per user per day
const MAX_IMAGE_B64 = 7_000_000; // ~5 MB decoded, Claude's image ceiling
const MAX_TEXT = 2_000;
const MEDIA_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

const SHAPE =
  'Respond ONLY with a JSON object (no prose, no code fences) with keys: name (string, short common dish name), matchConfidence (number 0-100), calories (number), protein (number, g), carbs (number, g), fat (number, g), fiber (number, g), sodium (number, mg), sugar (number, g), healthScore (number 1-10), ingredients (array of strings).';

const PROMPTS: Record<string, string> = {
  meal: `Identify the meal in this photo and estimate its nutrition. ${SHAPE} ingredients = visible ingredients.`,
  label:
    `This photo shows a food package's printed nutrition facts label. Read the label and report its nutrition EXACTLY as printed for one serving (fall back to per 100g if no serving is given; note which in the name, e.g. "Granola (per serving)"). Do not estimate — transcribe the printed values. matchConfidence reflects how legible the label is. ${SHAPE} ingredients = up to 6 ingredients from the printed ingredients list if visible, else [].`,
  voice:
    `The user described what they ate out loud. Parse the description and estimate realistic nutrition for the total amount described. ${SHAPE} ingredients = the foods mentioned.`,
};

function parseJson(text: string): unknown {
  const stripped = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  return JSON.parse(stripped);
}

/** Resolve the calling user from their JWT and count this call against their daily quota. */
async function authorize(req: Request, kind: string, limit: number): Promise<{ userId: string } | Response> {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return Response.json({ error: 'Not configured' }, { status: 500 });
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return Response.json({ error: 'Sign in to use this feature.' }, { status: 401 });

  const admin = createClient(url, serviceKey);
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return Response.json({ error: 'Sign in to use this feature.' }, { status: 401 });

  const { data: allowed, error: usageErr } = await admin.rpc('increment_ai_usage', {
    p_user: data.user.id,
    p_kind: kind,
    p_limit: limit,
  });
  if (usageErr) {
    // Fail open so a missing migration degrades to "no rate limit", not an outage.
    console.error('increment_ai_usage failed:', usageErr.message);
  } else if (allowed === false) {
    return Response.json({ error: 'Daily limit reached — try again tomorrow.' }, { status: 429 });
  }
  return { userId: data.user.id };
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'POST only' }, { status: 405 });
  }
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return Response.json({ error: 'ANTHROPIC_API_KEY is not configured on the server.' }, { status: 500 });
  }

  const auth = await authorize(req, 'scan', DAILY_LIMIT);
  if (auth instanceof Response) return auth;

  const { imageBase64, mediaType, mode, text } = (await req.json()) as {
    imageBase64?: string;
    mediaType?: string;
    mode?: 'meal' | 'label' | 'voice';
    text?: string;
  };
  const m = mode ?? 'meal';
  const prompt = PROMPTS[m] ?? PROMPTS.meal;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let content: any[];
  if (m === 'voice') {
    if (!text?.trim()) return Response.json({ error: 'Missing text for voice mode.' }, { status: 400 });
    if (text.length > MAX_TEXT) return Response.json({ error: 'Description is too long.' }, { status: 400 });
    content = [{ type: 'text', text: `${prompt}\n\nUser said: "${text.trim()}"` }];
  } else {
    if (!imageBase64 || !mediaType) {
      return Response.json({ error: 'Missing imageBase64 or mediaType.' }, { status: 400 });
    }
    if (!MEDIA_TYPES.has(mediaType)) {
      return Response.json({ error: 'Unsupported image type.' }, { status: 400 });
    }
    if (imageBase64.length > MAX_IMAGE_B64) {
      return Response.json({ error: 'Image is too large — try a smaller photo.' }, { status: 413 });
    }
    content = [
      { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
      { type: 'text', text: prompt },
    ];
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      messages: [{ role: 'user', content }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return Response.json(
      { error: (err as { error?: { message?: string } })?.error?.message ?? 'AI model call failed.' },
      { status: 502 },
    );
  }

  const data = await res.json();
  const answer: string = data?.content?.find((b: { type: string }) => b.type === 'text')?.text ?? '';
  try {
    return Response.json(parseJson(answer));
  } catch {
    return Response.json(
      { error: m === 'voice' ? 'Could not parse a meal from that description.' : 'Could not read nutrition from the photo.' },
      { status: 502 },
    );
  }
});
