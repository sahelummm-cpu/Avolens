// Deletes the calling user's account and their data. Requires the service-role
// key (auto-injected as SUPABASE_SERVICE_ROLE_KEY for deployed functions) to
// call the admin API. Deploy with JWT verification on so only signed-in users
// can reach it: supabase functions deploy delete-account
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'POST only' }, { status: 405 });
  }
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!url || !serviceKey || !authHeader.startsWith('Bearer ')) {
    return Response.json({ error: 'Not configured' }, { status: 500 });
  }

  const admin = createClient(url, serviceKey);

  // Identify the caller from their JWT.
  const { data: userData, error: userErr } = await admin.auth.getUser(authHeader.replace('Bearer ', ''));
  if (userErr || !userData.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = userData.user.id;

  // Best-effort cleanup of the user's rows + storage, then delete the auth user.
  await admin.from('profiles').delete().eq('id', userId).catch(() => {});
  try {
    const { data: files } = await admin.storage.from('progress-photos').list(userId);
    if (files && files.length) {
      await admin.storage.from('progress-photos').remove(files.map((f) => `${userId}/${f.name}`));
    }
  } catch {
    // ignore storage errors
  }

  const { error: delErr } = await admin.auth.admin.deleteUser(userId);
  if (delErr) return Response.json({ error: delErr.message }, { status: 502 });
  return Response.json({ ok: true });
});
