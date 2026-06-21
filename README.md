# EarnedLab

> Speed-first, accessibility-focused, all tasks completable in under 30 minutes — deployable on Railway in under 5 minutes.

## Quick Deploy to Railway

1. Push this folder to a new GitHub repository
2. Go to railway.app → New Project → Deploy from GitHub repo
3. Add environment variables (see below)
4. Deploy — Railway builds and starts automatically

## Required Environment Variables (Railway Dashboard)

```
ANTHROPIC_API_KEY=sk-ant-...
JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
DATABASE_URL=file:./prod.db
NODE_ENV=production
CLIENT_URL=https://your-app.up.railway.app
PORT=3000
```

## Optional (enables integrations)

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_GROWTH=price_...
STRIPE_PRICE_PRO=price_...
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://your-app.up.railway.app/api/integrations/google/callback
```

## Local Development

```bash
cp .env.example server/.env
# Fill in ANTHROPIC_API_KEY and JWT_SECRET

npm install --prefix server
npm install --prefix client
cd server && npx prisma db push && cd ..
# Terminal 1:
cd server && node index.js
# Terminal 2:
cd client && npx vite
```

Frontend: http://localhost:5173 | API: http://localhost:3000

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express  
- Database: SQLite via Prisma (upgrades to PostgreSQL by changing schema.prisma)
- AI: Anthropic Claude
- Auth: JWT + bcrypt

## Upgrading to PostgreSQL (recommended for production)

1. Add a PostgreSQL database in Railway
2. Change `provider = "sqlite"` to `provider = "postgresql"` in `server/prisma/schema.prisma`
3. Update `DATABASE_URL` to your PostgreSQL connection string from Railway
4. Redeploy
