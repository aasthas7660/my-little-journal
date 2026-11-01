-- A profile row is created automatically for every new account, whatever the
-- sign-in method (email, Google, or Sign in with Lovable).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(coalesce(new.email, 'friend'), '@', 1)
    )
  )
  on conflict (id) do update
    set display_name = coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      public.profiles.display_name
    );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- Backfill any accounts created before this trigger existed.
insert into public.profiles (id, display_name)
select u.id,
       coalesce(
         nullif(u.raw_user_meta_data ->> 'display_name', ''),
         nullif(u.raw_user_meta_data ->> 'full_name', ''),
         nullif(u.raw_user_meta_data ->> 'name', ''),
         split_part(coalesce(u.email, 'friend'), '@', 1)
       )
from auth.users u
on conflict (id) do nothing;