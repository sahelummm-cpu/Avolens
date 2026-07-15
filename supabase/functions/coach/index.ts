// AI nutrition coach chat — Supabase Edge Function.
// Requires the ANTHROPIC_API_KEY secret:
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// Callers must be signed-in users (the anon key alone is rejected) and are
// rate-limited per day via increment_ai_usage() (see the ai_usage migration).
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const DAILY_LIMIT = 200; // coach messages per user per day
const MAX_MESSAGE_CHARS = 4_000;
const MAX_CONTEXT_CHARS = 4_000;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
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

  const auth = await authorize(req, 'coach', DAILY_LIMIT);
  if (auth instanceof Response) return auth;

  const { messages, context } = (await req.json()) as {
    messages?: ChatMessage[];
    context?: Record<string, unknown>;
  };
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: 'Missing messages.' }, { status: 400 });
  }

  const safeMessages = messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));
  if (safeMessages.length === 0) {
    return Response.json({ error: 'Missing messages.' }, { status: 400 });
  }

  const contextJson = JSON.stringify(context ?? {}).slice(0, MAX_CONTEXT_CHARS);
  const system =
    'You are the AvoLens AI nutrition coach inside a calorie/macro tracking app. ' +
    'Be encouraging, concrete, and brief (2-5 short sentences unless asked for a list or plan). ' +
    'Use the JSON context of the user\'s goals and what they have eaten today to personalise answers. ' +
    'Never give medical diagnoses; suggest a professional for medical questions.\n\nContext: ' +
    contextJson;

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
      messages: safeMessages,
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
