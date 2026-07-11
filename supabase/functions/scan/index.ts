// AI meal scan — Supabase Edge Function twin of the web app's /api/scan.
// Requires the ANTHROPIC_API_KEY secret:
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const PROMPT =
  'Identify the meal in this photo and estimate its nutrition. Respond ONLY with a JSON object (no prose, no code fences) with keys: name (string, short common dish name), matchConfidence (number 0-100), calories (number), protein (number, g), carbs (number, g), fat (number, g), fiber (number, g), sodium (number, mg), sugar (number, g), healthScore (number 1-10), ingredients (array of strings, visible ingredients).';

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

  const { imageBase64, mediaType } = (await req.json()) as { imageBase64?: string; mediaType?: string };
  if (!imageBase64 || !mediaType) {
    return Response.json({ error: 'Missing imageBase64 or mediaType.' }, { status: 400 });
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
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
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
  const text: string = data?.content?.find((b: { type: string }) => b.type === 'text')?.text ?? '';
  try {
    return Response.json(parseJson(text));
  } catch {
    return Response.json({ error: 'Could not parse a nutrition estimate from the photo.' }, { status: 502 });
  }
});
