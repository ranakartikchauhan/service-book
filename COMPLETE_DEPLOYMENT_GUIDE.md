# 🚀 Complete Deployment & Mobile APK Testing Master Guide

This document contains end-to-end instructions for deploying all components of the **Work Marketplace Platform**:
1. 🌐 **Marketing Website** (Next.js → Vercel)
2. ⚙️ **Backend API** (Node.js/Express Serverless → Vercel)
3. 📊 **Admin Panel** (React Vite SPA → Vercel)
4. 📱 **Mobile App** (React Native / Expo → Live Expo Go & Standalone `.apk` Build)

---

## 📌 Repository Information
- **GitHub Repository**: `https://github.com/ranakartikchauhan/service-book.git`
- **Main Branch**: `main`
- All source files are tracked with `node_modules` safely ignored via `.gitignore`.

---

## 🛠️ Step 1: Deploy Backend & WebSockets (Render - Recommended for Socket.io)

Render supports persistent Node.js servers and native WebSockets on their free tier, making it ideal for Socket.io real-time chat, GPS location sharing, and SOS broadcasts.

### Deploying on Render (3-Minute Setup):
1. Go to [dashboard.render.com](https://dashboard.render.com) and click **New +** → **Web Service**.
2. Connect your GitHub repository: `https://github.com/ranakartikchauhan/service-book`.
3. Configure the settings:
   - **Name**: `work-marketplace-backend`
   - **Root Directory**: `work-marketplace/backend`
   - **Environment**: `Node`
   - **Region**: `Singapore` (closest to India) or `Frankfurt`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`
4. Under **Environment Variables**, add the following:
   | Key | Recommended Production Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `MONGO_URI` | `mongodb+srv://kartikchauhan336:QoBJmjXCYqObFnsp@cluster0.umvdwqv.mongodb.net/jobgramApp?retryWrites=true&w=majority` |
   | `JWT_SECRET` | `jobgram_super_secure_jwt_secret_2026_x99!#` |
   | `ADMIN_JWT_SECRET` | `jobgram_admin_jwt_secret_production_2026_key!` |
   | `CLOUDINARY_CLOUD_NAME` | `dmittu8hn` |
   | `CLOUDINARY_API_KEY` | `168996289798628` |
   | `CLOUDINARY_API_SECRET` | `IpzEqtCHQVJM-pT-R-zoJPPoZjs` |
   | `RAZORPAY_KEY_ID` | `rzp_test_placeholder_key` |
   | `RAZORPAY_KEY_SECRET` | `rzp_test_placeholder_secret` |
   | `ALLOWED_ORIGINS` | `*` |
5. Click **Create Web Service**.
6. Once deployed, copy your Render URL (e.g. `https://work-marketplace-backend.onrender.com`).
   - Health check: `https://work-marketplace-backend.onrender.com/api/health`

---

---

## 🌐 Step 2: Deploy Marketing Website (Next.js)

The landing website is built with Next.js App Router and optimized for instant SEO and high conversion.

### Option A: Via Vercel Web Dashboard (Recommended)
1. Go to [vercel.com/new](https://vercel.com/new) and click **Import** next to `service-book`.
2. Configure project settings:
   - **Project Name**: `workmarket-website`
   - **Root Directory**: Click *Edit* and select **`work-marketplace/marketing-website`**
   - **Framework Preset**: **Next.js** (Auto-detected)
   - **Build Command**: `next build` (Default)
   - **Output Directory**: `.next` (Default)
3. Click **Deploy**.
4. Your marketing website will be live at `https://workmarket-website.vercel.app`.

### Option B: Via Vercel CLI
```powershell
cd d:\service-book\work-marketplace\marketing-website
npx vercel --prod
```

---

## 📊 Step 3: Deploy Admin Panel (React Vite SPA)

The admin panel is built with React + Vite and includes a custom `vercel.json` rewrite rule to support single-page client-side routing.

### Option A: Via Vercel Web Dashboard (Recommended)
1. Go to [vercel.com/new](https://vercel.com/new) and click **Import** next to `service-book`.
2. Configure project settings:
   - **Project Name**: `workmarket-admin`
   - **Root Directory**: Click *Edit* and select **`work-marketplace/admin-panel`**
   - **Framework Preset**: **Vite**
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Expand **Environment Variables**:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://workmarket-backend-api.vercel.app/api` (your deployed backend API URL) |
4. Click **Deploy**.
5. Your admin portal is live at `https://workmarket-admin.vercel.app`.

### Option B: Via Vercel CLI
```powershell
cd d:\service-book\work-marketplace\admin-panel
npx vercel --prod
```

---

## 📱 Step 4: Mobile App Testing & Android APK Generation

The mobile application is built with React Native and Expo. You have two testing methods.

### Method 1: Instant Mobile Live Testing with Expo Go (Zero Waiting)
Test your mobile app in real-time on your physical smartphone:

1. **Install Expo Go on your mobile device**:
   - **Android**: [Download from Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - **iPhone (iOS)**: [Download from Apple App Store](https://apps.apple.com/app/expo-go/id982107490)

2. **Start the Expo development server with tunnel**:
   ```powershell
   cd d:\service-book\work-marketplace\mobile-app
   npx expo start --tunnel
   ```

3. **Open the app on your phone**:
   - **Android**: Open **Expo Go** app &rarr; Tap **Scan QR code** &rarr; Scan the terminal QR code.
   - **iPhone**: Open the default **Camera** app &rarr; Point at the QR code &rarr; Tap the Expo banner.

---

### Method 2: Build Standalone Android APK File (`.apk`)

The mobile app includes `work-marketplace/mobile-app/eas.json` configured for direct `.apk` compilation:

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

#### Step-by-Step APK Generation Commands:

1. **Log in to Expo Application Services (Free Account)**:
   ```powershell
   npx eas-cli login
   ```
   *(If you don't have an account, create one at [expo.dev/signup](https://expo.dev/signup) — it's free).*

2. **Trigger the Cloud APK Build**:
   ```powershell
   cd d:\service-book\work-marketplace\mobile-app
   npx eas-cli build -p android --profile preview
   ```

3. **Download & Install the APK**:
   - When the build finishes, EAS will output a **direct download URL** and a **QR Code** in your terminal.
   - Scan the QR code or open the download URL in your Android mobile browser.
   - Tap **Download APK** &rarr; Open the file &rarr; Install and test directly on your phone!

---

## 🔄 Quick Commands Summary Table

| Action | Working Directory | Command to Run |
|---|---|---|
| **Push Updates to GitHub** | `d:\service-book` | `git add . ; git commit -m "update" ; git push` |
| **Deploy Website** | `d:\service-book\work-marketplace\marketing-website` | `npx vercel --prod` |
| **Deploy Admin** | `d:\service-book\work-marketplace\admin-panel` | `npx vercel --prod` |
| **Deploy Backend** | `d:\service-book\work-marketplace\backend` | `npx vercel --prod` |
| **Live Mobile Test** | `d:\service-book\work-marketplace\mobile-app` | `npx expo start --tunnel` |
| **Build Android APK** | `d:\service-book\work-marketplace\mobile-app` | `npx eas-cli build -p android --profile preview` |

---

## 🔒 Security & Best Practices Checklist
- [x] All `.gitignore` files configured (No `node_modules` or `.env` committed)
- [ ] Set production MongoDB URI in Vercel backend environment variables
- [ ] Set `VITE_API_URL` in Admin panel to point to live Backend URL
- [ ] Set `API_BASE` in `work-marketplace/mobile-app/src/api/client.js` to live Backend URL before final production APK build
