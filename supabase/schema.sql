-- =============================================
-- LINKDROP — Supabase Schema
-- הרץ את זה ב-Supabase SQL Editor
-- =============================================

-- טבלת קישורים
create table if not exists links (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users(id) on delete cascade not null,
  original_url text not null,
  short_code   text unique not null,
  title        text,
  is_whatsapp  boolean default false,
  wa_phone     text,
  wa_message   text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
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

-- קישורים: כל אחד רואה רק את שלו, אבל כל אחד יכול לקרוא לפי short_code (לצורך redirect)
create policy "owner can do everything on own links"
  on links for all
  using (auth.uid() = user_id);

create policy "public can read link by short_code"
  on links for select
  using (true);

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
  where link_id = p_link_id;
$$;

-- =============================================
-- אינדקסים לביצועים
-- =============================================

create index if not exists idx_links_short_code on links(short_code);
create index if not exists idx_links_user_id    on links(user_id);
create index if not exists idx_clicks_link_id   on clicks(link_id);
create index if not exists idx_clicks_clicked_at on clicks(clicked_at);
