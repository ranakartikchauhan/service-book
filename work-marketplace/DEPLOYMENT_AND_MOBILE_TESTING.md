# 🚀 Deployment & Mobile Testing Guide — WorkMarket V1

This guide provides step-by-step instructions to **deploy to Vercel** and **test the mobile app on your smartphone**.

---

## 🌐 1. Deploying to Vercel

All three web-compatible sub-projects have been pre-configured for Vercel:
- **Marketing Website** (`marketing-website`): Native Next.js app
- **Admin Panel** (`admin-panel`): Vite React SPA with `vercel.json` SPA routing
- **Backend API** (`backend`): Serverless Express handler configured via `api/index.js` & `vercel.json`

### Option A: Deploy with Vercel CLI (Fastest)

Open PowerShell in the sub-project directory you want to deploy:

#### 1. Deploy Marketing Website (Next.js)
```powershell
cd d:\service-book\work-marketplace\marketing-website
npx vercel
# Follow prompts → accept defaults → deployed!
# For production URL:
npx vercel --prod
```

#### 2. Deploy Admin Panel (React Vite)
```powershell
cd d:\service-book\work-marketplace\admin-panel
npx vercel
# Follow prompts → accept defaults
# When prompted for build command: npm run build
# Output directory: dist
npx vercel --prod
```

#### 3. Deploy Backend API (Serverless Express)
```powershell
cd d:\service-book\work-marketplace\backend
npx vercel
# Set environment variables in Vercel Dashboard (MONGO_URI, JWT_SECRET, etc.)
npx vercel --prod
```

---

## 📱 2. How to Test the App on Your Mobile Phone

### ⚡ Method 1: Instant Live Testing with Expo Go (Recommended — No build waiting)

You can run and test the complete mobile app on your physical iPhone or Android device instantly:

1. **Install Expo Go** on your phone:
   - **Android**: [Google Play Store — Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - **iOS**: [Apple App Store — Expo Go](https://apps.apple.com/app/expo-go/id982107490)

2. **Start the Expo Dev Server with Tunnel**:
   ```powershell
   cd d:\service-book\work-marketplace\mobile-app
   npx expo start --tunnel
   ```

3. **Open on your device**:
   - **Android**: Open the **Expo Go** app and tap **Scan QR Code**, then scan the QR code in your terminal.
   - **iPhone**: Open the default **Camera** app, point it at the QR code, and tap the notification banner to open in Expo Go.

4. **Connect to your Backend**:
   - In `mobile-app/src/api/client.js`, set `API_BASE` to your computer's local Wi-Fi IP (e.g. `http://192.168.1.X:5000/api`) or your deployed Vercel backend URL.

---

### 📦 Method 2: Build a Standalone Android APK (`.apk` file)

We have created `eas.json` configured for direct `.apk` binary generation.

1. **Install EAS CLI**:
   ```powershell
   npm install -g eas-cli
   ```

2. **Login to your Expo account**:
   ```powershell
   eas login
   ```

3. **Build the APK**:
   ```powershell
   cd d:\service-book\work-marketplace\mobile-app
   eas build -p android --profile preview
   ```

4. Once the cloud build finishes, Expo will provide a direct **download link and QR code** to download the `.apk` directly to your Android phone.

---

### 💻 Method 3: Test Mobile App in Mobile Web Browser

To test the mobile interface directly in your mobile browser:

```powershell
cd d:\service-book\work-marketplace\mobile-app
npx expo start --web
```
Access the URL from your mobile device connected to the same Wi-Fi.
