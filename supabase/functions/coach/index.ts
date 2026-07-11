// AI nutrition coach chat — Supabase Edge Function.
// Requires the ANTHROPIC_API_KEY secret:
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'POST only' }, { status: 405 });
  }
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return Response.json({ error: 'ANTHROPIC_API_KEY is not configured on the server.' }, { status: 500 });
  }

  const { messages, context } = (await req.json()) as {
    messages?: ChatMessage[];
    context?: Record<string, unknown>;
  };
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: 'Missing messages.' }, { status: 400 });
  }

  const system =
    'You are the AvoLens AI nutrition coach inside a calorie/macro tracking app. ' +
    'Be encouraging, concrete, and brief (2-5 short sentences unless asked for a list or plan). ' +
    'Use the JSON context of the user\'s goals and what they have eaten today to personalise answers. ' +
    'Never give medical diagnoses; suggest a professional for medical questions.\n\nContext: ' +
    JSON.stringify(context ?? {});

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-8',
      max_tokens: 700,
      system,
      messages: messages
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .slice(-12),
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
  const reply: string = data?.content?.find((b: { type: string }) => b.type === 'text')?.text ?? '';
  if (!reply) return Response.json({ error: 'Empty model reply.' }, { status: 502 });
  return Response.json({ reply });
});
