// AI meal scan — Supabase Edge Function twin of the web app's /api/scan.
// Modes: 'meal' (photo of a plate), 'label' (photo of a nutrition-facts
// label, read exactly), 'voice' (spoken description as text, no image).
// Requires the ANTHROPIC_API_KEY secret:
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

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

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'POST only' }, { status: 405 });
  }
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return Response.json({ error: 'ANTHROPIC_API_KEY is not configured on the server.' }, { status: 500 });
  }

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
    content = [{ type: 'text', text: `${prompt}\n\nUser said: "${text.trim()}"` }];
  } else {
    if (!imageBase64 || !mediaType) {
      return Response.json({ error: 'Missing imageBase64 or mediaType.' }, { status: 400 });
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
