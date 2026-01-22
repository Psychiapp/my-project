# App Store Submission Checklist

This checklist outlines the steps needed to submit Psychi to the App Store.

## Completed Automatically

- [x] Privacy Policy (in-app: `/app/legal/privacy-policy.tsx`)
- [x] Terms of Service (in-app: `/app/legal/terms-of-service.tsx`)
- [x] EAS build configuration (`eas.json`)
- [x] Demo mode alerts removed
- [x] User report functionality (`components/ReportUserModal.tsx`)
- [x] User block functionality (`components/BlockUserModal.tsx`)
- [x] Earnings connected to real database

## Manual Configuration Required

### 1. EAS Project Setup

Run these commands to set up your EAS project:

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Log in to Expo
eas login

# Initialize EAS for this project (generates real project ID)
eas build:configure
```

This will update `app.json` with your actual project ID.

### 2. Environment Variables

Create a `.env.production` file with real API keys:

```
EXPO_PUBLIC_SUPABASE_URL=your-production-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-live-stripe-key
EXPO_PUBLIC_DAILY_API_KEY=your-daily-api-key
```

### 3. EAS Submit Configuration

Update `eas.json` submit section with your credentials:

```json
"submit": {
  "production": {
    "ios": {
      "appleId": "your-apple-id@example.com",
      "ascAppId": "your-app-store-connect-app-id",
      "appleTeamId": "your-apple-team-id"
    }
  }
}
```

### 4. App Store Connect Setup

1. Create app in App Store Connect
2. Fill in app description, keywords, and categories
3. Upload screenshots for all required device sizes
4. Add app preview videos (optional)
5. Complete the App Privacy questionnaire
6. Set up in-app purchases if using Stripe (or configure Apple IAP)

### 5. Build and Submit

```bash
# Build for App Store
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios --profile production
```

## Pre-Submission Testing

- [ ] Test all payment flows with real Stripe keys
- [ ] Test user authentication end-to-end
- [ ] Test session booking with real supporters
- [ ] Test video/voice calls with Daily.co
- [ ] Test report and block functionality
- [ ] Test emergency button (911/988)
- [ ] Test on multiple iOS device sizes
- [ ] Test account deletion flow

## App Store Review Notes

Include these notes for Apple reviewers:

```
Demo Account (Client):
Email: demo@psychi.app
Password: Demo2024!

Demo Account (Supporter):
Email: supporter@psychi.app
Password: Demo2024!

Demo Account (Admin):
Email: admin@psychi.app
Password: Demo2024!

IMPORTANT: This app provides peer support, NOT licensed therapy.
All disclaimers are displayed prominently in the app.
Emergency contacts (911, 988) are available on all screens.
```

## Potential Rejection Reasons to Address

1. **In-App Purchase** - If using Stripe for digital content, Apple may require IAP
2. **User-Generated Content** - Report/block features are implemented
3. **Medical/Health Category** - Clear disclaimers that this is NOT professional therapy
4. **Privacy Policy** - Accessible in-app at `/legal/privacy-policy`
5. **Terms of Service** - Accessible in-app at `/legal/terms-of-service`
