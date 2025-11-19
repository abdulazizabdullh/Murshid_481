# Google OAuth Setup Guide for Murshid

This guide walks you through setting up Google Authentication for the Murshid platform.

## Overview

Google OAuth has been added to both the Login and Signup pages, allowing users to sign in/up using their Google accounts. This provides a faster, more convenient authentication method while maintaining all existing email/password functionality.

## Features Added

- **Google Sign-In Button** on Login page
- **Google Sign-Up Button** on Signup page
- **OAuth Callback Handler** for processing authentication
- **Automatic Profile Creation** for new Google users
- **Seamless Integration** with existing Supabase authentication

## Prerequisites

Before you begin, ensure you have:
- A Supabase project (already configured)
- Access to Google Cloud Console
- Admin access to your Supabase project dashboard

## Step 1: Configure Google OAuth in Google Cloud Console

### 1.1 Create a Google Cloud Project (if you don't have one)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Enter project name (e.g., "Murshid Auth")
4. Click **Create**

### 1.2 Enable Google+ API

1. In your Google Cloud project, navigate to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click on it and press **Enable**

### 1.3 Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (unless you have Google Workspace)
3. Click **Create**
4. Fill in the required information:
   - **App name**: Murshid
   - **User support email**: Your email
   - **Developer contact information**: Your email
5. Click **Save and Continue**
6. On the Scopes page, click **Save and Continue** (default scopes are sufficient)
7. Add test users if needed (for development)
8. Click **Save and Continue**

### 1.4 Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Application type**: Web application
4. Enter a name (e.g., "Murshid Web Client")
5. Add **Authorized JavaScript origins**:
   ```
   http://localhost:8080
   https://your-production-domain.com
   ```
6. Add **Authorized redirect URIs**:
   ```
   https://your-supabase-project.supabase.co/auth/v1/callback
   ```

   **Important**: Replace `your-supabase-project` with your actual Supabase project reference.

   To find your project reference:
   - Go to your Supabase project dashboard
   - Look at the URL or Settings → API → Project URL
   - Format: `https://[PROJECT_REF].supabase.co`

7. Click **Create**
8. **Save your Client ID and Client Secret** (you'll need these next)

## Step 2: Configure Google OAuth in Supabase

### 2.1 Enable Google Provider

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Find **Google** in the list
5. Toggle it to **Enabled**

### 2.2 Add Google OAuth Credentials

1. In the Google provider settings, enter:
   - **Client ID**: (from Google Cloud Console)
   - **Client Secret**: (from Google Cloud Console)
2. Click **Save**

### 2.3 Verify Redirect URL

1. In Supabase, under **Authentication** → **URL Configuration**
2. Ensure your **Site URL** is set correctly:
   - Development: `http://localhost:8080`
   - Production: `https://your-production-domain.com`
3. Add these to **Redirect URLs**:
   ```
   http://localhost:8080/auth/callback
   https://your-production-domain.com/auth/callback
   ```

## Step 3: Update Environment Variables (Already Done)

The frontend is already configured to use your existing Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

No additional environment variables are needed for Google OAuth!

## Step 4: Profile Completion Flow (Already Implemented!)

### How It Works

When a user signs in with Google for the first time, the system automatically:

1. **Creates Basic Profile**:
   - User in Supabase Auth
   - Profile in `profiles` table with name and avatar from Google

2. **Redirects to Profile Setup**:
   - New users are redirected to `/profile-setup`
   - Existing users with incomplete profiles are also redirected

3. **User Completes Profile**:
   - Required fields: **Role** (Student/Specialist) and **Gender**
   - Conditional fields based on role:
     - **Students**: Student Type, Level/Track, University (optional)
     - **Specialists**: University, Level, Proof Upload

4. **Specialist Verification**:
   - Specialists must upload proof of status (student/graduate card)
   - Account is suspended pending admin approval
   - Admin reviews proof and unsuspends account

5. **Final Redirect**:
   - Students: Redirected to home page
   - Specialists: Redirected to suspended page (pending approval)
   - Admins: Redirected to admin dashboard

### Profile Setup Page Features

The `ProfileSetup.tsx` page includes:
- Display of user's Google name and email
- Role selection (Student/Specialist)
- Dynamic form fields based on selected role
- University selection for Specialists and University students
- Proof upload for Specialists
- Full bilingual support (EN/AR)
- Form validation with required field indicators
- Automatic profile update in database

## Step 5: Testing

### Test Locally

1. Start your development server:
   ```bash
   cd Murshid-Frontend
   npm run dev
   ```

2. Navigate to `http://localhost:8080/login`

3. Click the **"Continue with Google"** button

4. You should be redirected to Google's OAuth consent screen

5. After authorizing, you should be redirected back to your app and logged in

### Test Signup

1. Navigate to `http://localhost:8080/signup`
2. Click **"Sign up with Google"**
3. Complete the Google authentication
4. Verify that a profile is created in Supabase

### Verify in Supabase

1. Go to **Authentication** → **Users** in Supabase Dashboard
2. You should see the new user with provider: `google`
3. Check the `profiles` table to confirm profile creation

## Troubleshooting

### "Invalid OAuth client"
- Verify your Client ID and Secret in Supabase match Google Cloud Console
- Check that redirect URIs are exactly correct (no trailing slashes, correct protocol)

### "Redirect URI mismatch"
- Ensure the redirect URI in Google Cloud Console matches:
  `https://[YOUR_PROJECT].supabase.co/auth/v1/callback`
- Add all necessary redirect URIs (localhost + production)

### "Access blocked: This app's request is invalid"
- Complete the OAuth consent screen configuration
- Add your email as a test user (for development)
- Ensure Google+ API is enabled

### User logged in but profile not created
- Check browser console for errors
- Verify RLS policies on `profiles` table allow inserts
- Check Supabase logs for database errors

### Users redirected to wrong page
- Check the `AuthCallback.tsx` logic
- Verify routing in `App.tsx`
- Ensure `navigate()` paths are correct

## Production Deployment

### Before Deploying

1. **Update Google Cloud Console**:
   - Add production domain to Authorized JavaScript origins
   - Add production callback URL to Authorized redirect URIs

2. **Update Supabase**:
   - Set production Site URL
   - Add production callback URL to Redirect URLs

3. **Test thoroughly**:
   - Test both login and signup flows
   - Verify profile creation
   - Check admin/specialist flows
   - Test on different browsers

### Security Considerations

- Never commit Google OAuth credentials to version control
- Use environment variables for sensitive data
- Enable 2FA on Google Cloud Console account
- Regularly rotate OAuth client secrets
- Monitor Supabase auth logs for suspicious activity
- Consider implementing rate limiting for OAuth callbacks

## User Experience Features

### Implemented Features

1. **✅ Profile Completion Flow**
   - Dedicated `/profile-setup` page for new Google users
   - Guides users through selecting role, student type, etc.
   - Required fields clearly marked
   - Prevents access to app until profile is complete

2. **✅ Avatar Sync**
   - Google profile picture automatically saved to `avatar_url`
   - Can be displayed in Profile page

3. **✅ Specialist Verification**
   - Specialists must upload proof during profile setup
   - Account automatically suspended pending admin approval
   - Redirected to `/suspended` page with status message

### Future Enhancements

1. **Email Verification Indicator**
   - Google-authenticated users have verified emails
   - Consider adding a `email_verified` badge in profile

2. **Link Accounts**
   - Allow users to link Google account to existing email/password account
   - Prevent duplicate accounts for same email
   - Add "Connect with Google" option in profile settings

## Code Changes Summary

### Files Modified

1. **`src/contexts/AuthContext.tsx`**
   - Added `loginWithGoogle()` method
   - Handles OAuth flow and profile creation

2. **`src/pages/Login.tsx`**
   - Added Google sign-in button
   - Added divider ("Or")
   - Bilingual support (EN/AR)

3. **`src/pages/Signup.tsx`**
   - Added Google sign-up button
   - Added divider ("Or")
   - Bilingual support (EN/AR)

4. **`src/pages/AuthCallback.tsx`** (NEW)
   - Handles OAuth callback from Google
   - Creates basic profile if doesn't exist
   - Checks for incomplete profiles
   - Redirects to `/profile-setup` for new/incomplete users
   - Handles suspended accounts

5. **`src/pages/ProfileSetup.tsx`** (NEW)
   - Complete profile setup form
   - Role-based dynamic fields
   - University selection
   - Specialist proof upload
   - Form validation with required field indicators
   - Bilingual support (EN/AR)
   - Automatic redirection after completion

6. **`src/App.tsx`**
   - Added `/auth/callback` route
   - Added `/profile-setup` route (protected)

### UI/UX Features

- Google logo integrated into buttons
- Consistent styling with existing buttons
- Loading states
- Error handling with toast notifications
- RTL support for Arabic
- Responsive design

## Support

If you encounter issues:
1. Check Supabase logs: Dashboard → Logs → Auth logs
2. Check browser console for JavaScript errors
3. Verify all URLs and credentials
4. Ensure Google+ API is enabled
5. Check OAuth consent screen is published (if applicable)

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Google OAuth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
