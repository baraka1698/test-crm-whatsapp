/*
# Auto-create profile on signup

1. Overview
When a new user signs up via Supabase Auth, a row in the `profiles` table must be
created automatically so the user has a profile immediately after registration.

2. Changes
- Create a PL/pgSQL function `handle_new_user()` that inserts a profile row
  using the new user's id, email, and name from raw_user_meta_data.
- Create a trigger `on_auth_user_created` on `auth.users` that fires AFTER INSERT
  and calls `handle_new_user()`.
- The function is SECURITY DEFINER so it can write to `profiles` even though
  the triggering role (anon/authenticated) would not normally have INSERT rights
  through RLS. This is safe because the function only inserts a row with
  id = NEW.id (the just-created auth user).

3. Security
- The function runs with elevated privileges (SECURITY DEFINER) but only
  inserts a single row whose id matches the newly created auth user.
- No user can call this function directly to create arbitrary profiles.
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
