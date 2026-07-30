-- =============================================
-- LINKDROP — Supabase Schema
-- הרץ את זה ב-Supabase SQL Editor
-- =============================================

-- טבלת קישורים
create table if not exists links (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users(id) on delete cascade,
  original_url text not null,
  short_code   text unique not null,
  title        text,
  is_whatsapp  boolean default false,
  wa_phone     text,
  wa_message   text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table links alter column user_id drop not null;

alter table links
drop constraint if exists links_short_code_not_reserved;

alter table links
add constraint links_short_code_not_reserved
check (
  short_code not in (
    'auth',
    'dashboard',
    'privacy',
    'terms'
  )
);

-- טבלת קליקים
create table if not exists clicks (
  id         uuid default gen_random_uuid() primary key,
  link_id    uuid references links(id) on delete cascade not null,
  clicked_at timestamptz default now(),
  user_agent text,
  referrer   text,
  country    text,
  device     text  -- 'mobile' | 'desktop' | 'tablet'
);

-- =============================================
-- Row Level Security — מניעת זליגת מידע
-- =============================================

alter table links  enable row level security;
alter table clicks enable row level security;

do $$
declare
  p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'links'
  loop
    execute format('drop policy if exists %I on public.links', p.policyname);
  end loop;

  for p in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'clicks'
  loop
    execute format('drop policy if exists %I on public.clicks', p.policyname);
  end loop;
end $$;

-- קישורים: משתמש רואה ומנהל רק את הקישורים שלו.
-- קישורים אנונימיים ניתנים ליצירה, אבל לא ניתנים לסריקה ציבורית מהטבלה.
create policy "owner can read own links"
  on links for select
  using (auth.uid() = user_id);

create policy "owner can insert own links"
  on links for insert
  with check (auth.uid() = user_id);

create policy "anonymous can insert public links"
  on links for insert
  with check (auth.uid() is null and user_id is null);

create policy "owner can update own links"
  on links for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "owner can delete own links"
  on links for delete
  using (auth.uid() = user_id);

-- קליקים: רק הבעלים של הקישור רואה את הקליקים שלו
create policy "owner can read own clicks"
  on clicks for select
  using (
    exists (
      select 1 from links
      where links.id = clicks.link_id
        and links.user_id = auth.uid()
    )
  );

-- כל אחד יכול להוסיף קליק (redirect אנונימי)
create policy "anyone can insert a click"
  on clicks for insert
  with check (true);

-- Redirect ציבורי לפי short_code בלבד, בלי לפתוח select מלא לטבלת links.
create or replace function resolve_link(p_short_code text)
returns table (
  id uuid,
  original_url text,
  is_whatsapp boolean,
  wa_phone text,
  wa_message text
)
language sql
security definer
set search_path = public
as $$
  select l.id, l.original_url, l.is_whatsapp, l.wa_phone, l.wa_message
  from links l
  where l.short_code = p_short_code
  limit 1;
$$;

grant execute on function resolve_link(text) to anon, authenticated;

-- =============================================
-- פונקציה: קבל סטטיסטיקות לקישור
-- =============================================

create or replace function get_link_stats(p_link_id uuid)
returns table (
  total_clicks bigint,
  clicks_today bigint,
  clicks_this_week bigint,
  top_device text
)
language sql security definer as $$
  select
    count(*) as total_clicks,
    count(*) filter (where clicked_at > now() - interval '1 day') as clicks_today,
    count(*) filter (where clicked_at > now() - interval '7 days') as clicks_this_week,
    mode() within group (order by device) as top_device
  from clicks
  where link_id = p_link_id
    and exists (
      select 1
      from links
      where links.id = p_link_id
        and links.user_id = auth.uid()
    );
$$;

revoke execute on function get_link_stats(uuid) from public, anon;
grant execute on function get_link_stats(uuid) to authenticated;

create or replace function get_link_analytics(p_link_id uuid)
returns table (
  total_clicks bigint,
  clicks_today bigint,
  clicks_7d bigint,
  daily jsonb,
  devices jsonb,
  referrers jsonb,
  recent jsonb
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from links
    where links.id = p_link_id
      and links.user_id = auth.uid()
  ) then
    return;
  end if;

  return query
  with scoped_clicks as (
    select *
    from clicks
    where clicks.link_id = p_link_id
  )
  select
    (select count(*) from scoped_clicks) as total_clicks,
    (select count(*) from scoped_clicks where clicked_at >= current_date) as clicks_today,
    (select count(*) from scoped_clicks where clicked_at >= current_date - interval '6 days') as clicks_7d,
    coalesce((
      select jsonb_agg(jsonb_build_object('day', d_day::date::text, 'clicks', click_count) order by d_day)
      from (
        select
          days.d_day,
          count(scoped_clicks.id) as click_count
        from generate_series(current_date - interval '6 days', current_date, interval '1 day') as days(d_day)
        left join scoped_clicks
          on scoped_clicks.clicked_at >= days.d_day
         and scoped_clicks.clicked_at < days.d_day + interval '1 day'
        group by days.d_day
        order by days.d_day
      ) daily_counts
    ), '[]'::jsonb) as daily,
    coalesce((
      select jsonb_agg(jsonb_build_object('device', device_name, 'clicks', click_count) order by click_count desc, device_name)
      from (
        select coalesce(nullif(device, ''), 'unknown') as device_name, count(*) as click_count
        from scoped_clicks
        group by coalesce(nullif(device, ''), 'unknown')
      ) device_counts
    ), '[]'::jsonb) as devices,
    coalesce((
      select jsonb_agg(jsonb_build_object('referrer', referrer_name, 'clicks', click_count) order by click_count desc, referrer_name)
      from (
        select coalesce(nullif(referrer, ''), 'Direct') as referrer_name, count(*) as click_count
        from scoped_clicks
        group by coalesce(nullif(referrer, ''), 'Direct')
        order by click_count desc, referrer_name
        limit 6
      ) referrer_counts
    ), '[]'::jsonb) as referrers,
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', id,
          'clicked_at', clicked_at,
          'device', coalesce(nullif(device, ''), 'unknown'),
          'referrer', coalesce(nullif(referrer, ''), 'Direct')
        )
        order by clicked_at desc
      )
      from (
        select id, clicked_at, device, referrer
        from scoped_clicks
        order by clicked_at desc
        limit 10
      ) recent_clicks
    ), '[]'::jsonb) as recent;
end;
$$;

revoke execute on function get_link_analytics(uuid) from public, anon;
grant execute on function get_link_analytics(uuid) to authenticated;

-- =============================================
-- אינדקסים לביצועים
-- =============================================

create index if not exists idx_links_short_code on links(short_code);
create index if not exists idx_links_user_id    on links(user_id);
create index if not exists idx_clicks_link_id   on clicks(link_id);
create index if not exists idx_clicks_clicked_at on clicks(clicked_at);
