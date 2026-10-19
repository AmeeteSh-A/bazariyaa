# Bazariyaa (Next.js)
1. `cp .env.example .env.local` and set `SUPABASE_SECRET_KEY` (server-only, never `NEXT_PUBLIC_`).
2. `npm install && npm run dev`
Without the key the site falls back to static showcase products.
