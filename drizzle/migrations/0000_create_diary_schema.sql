-- Profiles (display name), linked to auth users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Diary entries
create table public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default '',
  entry_date date not null,
  mood text not null default 'calm',
  content text not null default '',
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index diary_entries_user_date_idx on public.diary_entries (user_id, entry_date desc);

-- Letters to myself
create table public.letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default '',
  letter_date date not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index letters_user_date_idx on public.letters (user_id, letter_date desc);

-- Keep updated_at fresh
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger diary_entries_updated_at before update on public.diary_entries
for each row execute function public.set_updated_at();
create trigger letters_updated_at before update on public.letters
for each row execute function public.set_updated_at();

-- Create a profile automatically when a user signs up
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- Data API access
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
grant select, insert, update, delete on public.diary_entries to authenticated;
grant all on public.diary_entries to service_role;
grant select, insert, update, delete on public.letters to authenticated;
grant all on public.letters to service_role;

-- Row Level Security: users only ever see their own data
alter table public.profiles enable row level security;
alter table public.diary_entries enable row level security;
alter table public.letters enable row level security;

create policy "profiles_select_own" on public.profiles
for select to authenticated using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "diary_select_own" on public.diary_entries
for select to authenticated using (auth.uid() = user_id);
create policy "diary_insert_own" on public.diary_entries
for insert to authenticated with check (auth.uid() = user_id);
create policy "diary_update_own" on public.diary_entries
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "diary_delete_own" on public.diary_entries
for delete to authenticated using (auth.uid() = user_id);

create policy "letters_select_own" on public.letters
for select to authenticated using (auth.uid() = user_id);
create policy "letters_insert_own" on public.letters
for insert to authenticated with check (auth.uid() = user_id);
create policy "letters_update_own" on public.letters
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "letters_delete_own" on public.letters
for delete to authenticated using (auth.uid() = user_id);