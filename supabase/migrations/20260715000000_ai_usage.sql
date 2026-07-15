-- Per-user daily counters for the AI edge functions (scan / coach), used for
-- simple server-side rate limiting. Rows are only touched by the
-- increment_ai_usage() function, called from edge functions with the
-- service-role key.
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  kind text not null,
  count integer not null default 0,
  primary key (user_id, day, kind)
);

alter table public.ai_usage enable row level security;
-- No policies on purpose: only the service role (which bypasses RLS) touches it.

create or replace function public.increment_ai_usage(p_user uuid, p_kind text, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  insert into public.ai_usage as u (user_id, day, kind, count)
  values (p_user, current_date, p_kind, 1)
  on conflict (user_id, day, kind)
  do update set count = u.count + 1
  returning u.count into new_count;
  return new_count <= p_limit;
end;
$$;

revoke execute on function public.increment_ai_usage(uuid, text, integer) from public, anon, authenticated;
