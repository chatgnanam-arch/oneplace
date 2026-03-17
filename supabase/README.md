# Supabase Database

This folder now uses migration files as the source of truth for all user-owned data:

- `profiles`
- `user_preferences`
- `collections` (the app's private categories)
- `bookmarks`

## Local setup

1. Install the Supabase CLI.
2. Start the local stack:

```bash
supabase start
```

3. Apply the migrations and seed file:

```bash
supabase db reset
```

4. Read the local API URL and anon key:

```bash
supabase status
```

5. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` using the local values from `supabase status`.
6. Start the app:

```bash
npm run dev
```

## Cloud rollout

1. Link this project to your hosted Supabase project:

```bash
supabase link --project-ref <your-project-ref>
```

2. Push the same migrations to cloud:

```bash
supabase db push
```

The migration `supabase/migrations/20260317180000_init_user_data.sql` is written to work for both fresh local environments and hosted Supabase projects. It includes:

- auth-to-profile sync triggers
- per-user RLS policies
- indexes for user/category/bookmark lookups
- ownership guards so bookmarks cannot point at another user's category

The follow-up migrations `supabase/migrations/20260317183000_client_vault_encryption.sql` and `supabase/migrations/20260317184500_enhanced_vault_profiles.sql` add client-vault metadata, encrypted bookmark columns, and the enhanced vault profile setting. Bookmark content is encrypted in the browser with a user passphrase before upload, and decrypted locally after retrieval.
