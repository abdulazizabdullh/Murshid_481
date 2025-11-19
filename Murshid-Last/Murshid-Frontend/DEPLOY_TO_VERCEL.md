# 🚀 Complete Vercel Deployment Guide - Step by Step

This guide will walk you through deploying your Murshid website to Vercel with all the details you need.

---

## 📋 Prerequisites

Before starting, make sure you have:
- ✅ GitHub account
- ✅ Vercel account (sign up at https://vercel.com - it's free!)
- ✅ Your code pushed to GitHub
- ✅ Your NEW Supabase project credentials ready

---

## 🔧 Step 1: Prepare Your Code

### 1.1: Test Build Locally

First, make sure your code builds successfully:

```bash
cd Murshid-Frontend
npm run build
```

If this works, you're good to go! If there are errors, fix them first.

### 1.2: Commit and Push to GitHub

Make sure all your code is committed and pushed:

```bash
# From project root
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

**Important files that should be committed:**
- ✅ `Murshid-Frontend/package.json`
- ✅ `Murshid-Frontend/vite.config.ts`
- ✅ `Murshid-Frontend/src/` (all source code)
- ✅ `vercel.json` (in root directory)
- ❌ `.env` (should NOT be committed - it's in .gitignore)

---

## 🌐 Step 2: Create Vercel Account & Project

### 2.1: Sign Up / Login to Vercel

1. Go to https://vercel.com
2. Click **"Sign Up"** (or **"Log In"** if you have an account)
3. Choose **"Continue with GitHub"** (recommended - easiest)
4. Authorize Vercel to access your GitHub

### 2.2: Import Your Project

1. In Vercel Dashboard, click **"Add New Project"**
2. You'll see a list of your GitHub repositories
3. Find and click on your **Murshid repository**
4. Click **"Import"**

---

## ⚙️ Step 3: Configure Project Settings

### 3.1: Framework & Build Settings

Vercel should auto-detect Vite, but verify these settings:

- **Framework Preset:** `Vite` (should be auto-detected)
- **Root Directory:** `Murshid-Frontend` (click "Edit" and set this)
- **Build Command:** `npm run build` (auto-filled)
- **Output Directory:** `dist` (auto-filled)
- **Install Command:** `npm install` (auto-filled)

### 3.2: Environment Variables (CRITICAL!)

**This is the most important step!**

1. Before clicking "Deploy", click **"Environment Variables"**
2. Add these variables one by one:

   **Variable 1:**
   - **Name:** `VITE_SUPABASE_URL`
   - **Value:** Your NEW Supabase project URL
     - Get it from: Supabase Dashboard → Settings → API → Project URL
     - Example: `https://xxxxx.supabase.co`
   - **Environment:** Select all (Production, Preview, Development)
   - Click **"Add"**

   **Variable 2:**
   - **Name:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** Your NEW Supabase anon key
     - Get it from: Supabase Dashboard → Settings → API → anon public key
     - It's a long JWT token
   - **Environment:** Select all (Production, Preview, Development)
   - Click **"Add"**

   **Variable 3 (if you have a backend):**
   - **Name:** `VITE_BACKEND_URL`
   - **Value:** Your backend URL (e.g., `http://localhost:8081` or your production backend URL)
   - **Environment:** Select all
   - Click **"Add"**

3. **Verify all variables are added** before proceeding

---

## 🚀 Step 4: Deploy!

1. Click **"Deploy"** button
2. Wait for the build to complete (usually 1-3 minutes)
3. You'll see build logs in real-time
4. When it says **"Ready"**, your site is live!

### 4.1: Get Your Live URL

After deployment, you'll get a URL like:
- `https://your-project-name.vercel.app`
- Or `https://your-project-name-xxxxx.vercel.app`

**Save this URL!** You'll need it for Supabase configuration.

---

## 🔐 Step 5: Configure Supabase for Production

### 5.1: Update Supabase Redirect URLs

1. Go to your **NEW Supabase project** dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Update these settings:

   **Site URL:**
   - Set to your Vercel URL: `https://your-project.vercel.app`

   **Redirect URLs:**
   - Add these URLs (one per line):
     ```
     https://your-project.vercel.app
     https://your-project.vercel.app/auth/callback
     https://your-project.vercel.app/reset-password
     ```
   - If you have a custom domain, add that too

4. Click **"Save"**

### 5.2: Verify RLS Policies

Make sure Row Level Security is enabled:
1. Go to **Authentication** → **Policies**
2. Verify all tables have RLS enabled
3. Check that policies are correctly configured

---

## ✅ Step 6: Test Your Deployed Site

### 6.1: Basic Checks

Visit your Vercel URL and test:

- [ ] Homepage loads
- [ ] No console errors (press F12 to check)
- [ ] Signup page works
- [ ] Login page works
- [ ] Can create an account
- [ ] Can login
- [ ] Profile page works
- [ ] All routes work (try navigating)

### 6.2: Create Admin User

1. Sign up with your email on the deployed site
2. Go to Supabase Dashboard → **Table Editor** → `profiles`
3. Find your profile
4. Set `is_admin = true`
5. Refresh the deployed site
6. You should now have admin access

---

## 🔄 Step 7: Set Up Continuous Deployment

Vercel automatically deploys when you push to GitHub:

1. **Make changes** to your code
2. **Commit and push:**
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```
3. **Vercel automatically:**
   - Detects the push
   - Runs a new build
   - Deploys if successful
   - Updates your live site

### 7.1: Preview Deployments

- Every branch gets a preview URL
- Test features before merging
- Share preview links with team

---

## 🌍 Step 8: Custom Domain (Optional)

### 8.1: Add Custom Domain

1. Go to Vercel Dashboard → Your Project
2. Click **Settings** → **Domains**
3. Click **"Add Domain"**
4. Enter your domain (e.g., `murshid.com`)
5. Follow DNS configuration instructions
6. Vercel provides free SSL certificate automatically

### 8.2: Update Supabase

After setting custom domain:
1. Update Supabase **Site URL** to your custom domain
2. Add custom domain to **Redirect URLs**

---

## 🐛 Troubleshooting

### Issue: Build Fails

**Check build logs in Vercel:**
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on failed deployment
3. Check error messages

**Common fixes:**
```bash
# Test build locally first
cd Murshid-Frontend
npm run build

# If it fails locally, fix errors first
```

### Issue: Blank Page After Deployment

**Check:**
1. Browser console (F12) for errors
2. Environment variables are set correctly
3. Supabase project is active (not paused)

**Solution:**
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Check Supabase Dashboard → Settings → API

### Issue: Routes Return 404

**Solution:**
- Verify `vercel.json` exists in root directory
- Check that `rewrites` configuration is correct
- Redeploy the project

### Issue: "Failed to fetch" or CORS Errors

**Solution:**
1. Check Supabase project is active
2. Verify environment variables
3. Check Supabase → Settings → API → CORS settings
4. Make sure your Vercel URL is allowed

### Issue: Environment Variables Not Working

**Solution:**
1. Vercel Dashboard → Settings → Environment Variables
2. Make sure variables are set for **Production** environment
3. **Redeploy** after adding/changing variables (they don't update automatically)

---

## 📊 Monitoring & Analytics

### Vercel Analytics (Free)

1. Go to Vercel Dashboard → Your Project
2. Click **Analytics** tab
3. Enable Vercel Analytics (free tier available)
4. Monitor:
   - Page views
   - Performance metrics
   - Core Web Vitals

---

## 📝 Quick Reference

### Important URLs

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Your Live Site:** `https://your-project.vercel.app`
- **Supabase Dashboard:** https://app.supabase.com

### Environment Variables Needed

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_BACKEND_URL=http://localhost:8081 (optional)
```

### Build Settings

- **Framework:** Vite
- **Root Directory:** `Murshid-Frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

---

## ✅ Deployment Checklist

Before deploying:
- [ ] Code is pushed to GitHub
- [ ] Local build works (`npm run build`)
- [ ] Environment variables ready
- [ ] Supabase project is active
- [ ] Supabase redirect URLs configured

After deploying:
- [ ] Site loads without errors
- [ ] Can sign up
- [ ] Can login
- [ ] All routes work
- [ ] Admin access works
- [ ] No console errors

---

## 🎉 You're Done!

Your Murshid website is now live on Vercel! 🚀

**Next Steps:**
- Share your live URL
- Monitor performance
- Set up custom domain (optional)
- Continue developing with automatic deployments

---

## 📞 Need Help?

- **Vercel Docs:** https://vercel.com/docs
- **Vite Deployment:** https://vitejs.dev/guide/static-deploy.html
- **Check build logs** in Vercel Dashboard for specific errors

