# Work Marketplace — V1 MVP

A local gig marketplace for India. Workers find jobs, posters hire workers, payments happen in-app.

## Project Structure

```
work-marketplace/
├── backend/              # Node.js + Express API
├── mobile-app/           # React Native (Expo)
├── admin-panel/          # React web dashboard
└── marketing-website/    # Next.js landing page
```

## Quick Start

### 1. Backend

```bash
cd backend
cp .env.example .env         # fill in your credentials
npm run dev                  # starts on port 5000
```

> Requires MongoDB running locally (`mongod`) or set `MONGO_URI` to a cloud instance.

### 2. Admin Panel

```bash
cd admin-panel
npm run dev                  # starts on port 5173
```

Open `http://localhost:5173` → login with credentials from your `.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`)

> First run: call `POST /api/admin/seed-categories` to populate the default job categories.

### 3. Marketing Website

```bash
cd marketing-website
npm run dev                  # starts on port 3000
```

### 4. Mobile App

```bash
cd mobile-app
npx expo start
```

Open the Expo Go app on your phone and scan the QR code.

> ⚠️ Change `API_BASE` in `src/api/client.js` from `localhost` to your machine's LAN IP address when testing on a physical device.

## Environment Variables

See `backend/.env.example` for all required variables.

**Required for full functionality:**
- `MONGO_URI` — MongoDB connection string
- `CLOUDINARY_*` — For photo and ID doc uploads
- `RAZORPAY_*` — For payments (use Razorpay test keys during dev)
- `FIREBASE_SERVICE_ACCOUNT_PATH` — For push notifications (optional in dev — app works without it)

## V1 Feature Status

| Feature | Status |
|---|---|
| Auth (register/login) | ✅ |
| Worker profile + ID verification | ✅ |
| Job posting (poster) | ✅ |
| Nearby job discovery (worker) | ✅ |
| Applications + hiring | ✅ |
| In-app chat (Socket.io) | ✅ |
| Razorpay escrow payments | ✅ |
| Two-way reviews | ✅ |
| SOS safety button | ✅ |
| Push notifications (FCM) | ✅ |
| Admin panel | ✅ |
| Marketing website | ✅ |

## V2 (next)

Subscriptions, map view, saved job alerts. See `PLATFORM_VERSIONS_ROADMAP.md`.
