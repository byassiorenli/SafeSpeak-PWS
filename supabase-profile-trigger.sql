-- SafeSpeak fase 1: profiel automatisch aanmaken na Supabase Auth-signup.
-- Lees README.md en controleer eerst of er al een auth.users trigger bestaat
-- die public.profiles vult. Voer dit niet blind uit als je al een eigen trigger hebt.

create or replace function public.handle_new_safespeak_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  email_value text;
  first_name text;
  last_name text;
begin
  email_value := lower(coalesce(new.email, ''));
  if split_part(email_value, '@', 2) <> 'fiorettileerling.nl' then
    raise exception 'Gebruik je Fioretti-schoolmailadres om een account aan te maken.';
  end if;

  first_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'voornaam', '')), '');
  last_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'achternaam', '')), '');

  if first_name is null or last_name is null then
    raise exception 'Voornaam en achternaam zijn verplicht.';
  end if;

  insert into public.profiles (id, role, username, voornaam, achternaam)
  values (new.id, 'leerling'::public.app_role, null, first_name, last_name)
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Before running, inspect existing triggers on auth.users in the Supabase dashboard.
-- If no existing profile-creation trigger exists, run this:
-- create trigger on_auth_user_created_safespeak
--   after insert on auth.users
--   for each row execute procedure public.handle_new_safespeak_user();
