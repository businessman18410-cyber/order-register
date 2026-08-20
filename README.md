# Order Register

A simple shared order tracker — mark textile orders as Pending or Done, synced live across every device.

## 1. Set up Supabase (the database)

1. Go to [supabase.com](https://supabase.com), sign in with GitHub, click **New project**.
2. Pick any project name, set a database password (save it somewhere), choose a region near you (e.g. Singapore for India), and wait ~2 minutes for it to spin up.
3. Open the **SQL Editor** (left sidebar) → **New query**, paste in the contents of `supabase-setup.sql` from this folder, and click **Run**. This creates the `orders` table.
4. Go to **Project Settings** (gear icon) → **API**. Copy:
   - **Project URL**
   - **anon public** key

Keep this tab open, you'll need these two values in a minute.

## 2. Push this code to GitHub

1. Go to [github.com](https://github.com) → **New repository** → name it e.g. `order-register` → Create.
2. On your computer, in this folder, run:
   ```bash
   git init
   git add .
   git commit -m "Order register app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/order-register.git
   git push -u origin main
   ```
   (Replace `YOUR_USERNAME` with your GitHub username. GitHub will show you this exact command on the new repo page too.)

## 3. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com), sign in with GitHub, click **Add New → Project**.
2. Import the `order-register` repo you just pushed.
3. Before clicking Deploy, expand **Environment Variables** and add:
   - `VITE_SUPABASE_URL` → paste your Project URL from step 1
   - `VITE_SUPABASE_ANON_KEY` → paste your anon public key from step 1
4. Click **Deploy**. In about a minute you'll get a live URL like `order-register-yourname.vercel.app`.

That URL is permanent, works on any device, and updates automatically every time you `git push` new changes.

## 4. Install it on your devices

- **Office computer**: open the Vercel URL in Chrome/Edge, bookmark it or pin the tab.
- **Phone**: open the same URL in Safari (iPhone) or Chrome (Android) → Share/Menu → **Add to Home Screen**. It'll behave like an installed app.

## Local development (optional)

If you want to run it on your own computer before deploying:

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase URL and key
npm run dev
```

## Notes

- Anyone with the app URL can view and add/edit orders — there's no login screen. That's fine for an internal office tool, but don't share the link publicly. If you want a login later (e.g. staff password), that's a straightforward addition with Supabase Auth.
- Free tiers: Supabase's free tier and Vercel's free tier are both far more than enough for a small trading firm's order volume.
