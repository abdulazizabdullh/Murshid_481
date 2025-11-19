# 🚀 Murshid - Vercel Deployment Guide

## 📁 Repository Structure

```
Murshid/
├── vercel.json              # ← Vercel config (root)
├── Murshid-Backend/         # Spring Boot backend
└── Murshid-Frontend/        # React + Vite frontend
    ├── src/
    ├── dist/                # Build output
    ├── package.json
    └── vite.config.ts
```

## ⚙️ Configuration Files

### ✅ `vercel.json` (Root of repo)
Already configured with:
- Build command: `cd Murshid-Frontend && npm run build`
- Output directory: `Murshid-Frontend/dist`
- Install command: `cd Murshid-Frontend && npm install`

### ✅ `vite.config.ts` (Murshid-Frontend/)
Already configured with:
- Base path: `/`
- Build optimizations
- Code splitting

## 🚀 Deploy to Vercel

### Step 1: Push to GitHub

```bash
# Make sure you're in the root directory
cd /path/to/Murshid

# Add all files
git add .

# Commit
git commit -m "Configure for Vercel deployment"

# Push to your repo
git push origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Click **"Import Git Repository"**
4. Select your GitHub repo: `hamza808111/Murshid`

### Step 3: Configure Project

Vercel will auto-detect settings from `vercel.json`, but verify:

- **Framework Preset:** Vite
- **Root Directory:** `.` (leave as root, the vercel.json handles the subdirectory)
- **Build Command:** `cd Murshid-Frontend && npm run build` (from vercel.json)
- **Output Directory:** `Murshid-Frontend/dist` (from vercel.json)
- **Install Command:** `cd Murshid-Frontend && npm install` (from vercel.json)

### Step 4: Environment Variables

Click **"Environment Variables"** and add:

| Name | Value | Where to find |
|------|-------|---------------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbG...` | Supabase → Settings → API → Project API keys → anon/public |

**Important:** 
- Add these for **Production**, **Preview**, and **Development** environments
- Click "Add" after each variable

### Step 5: Deploy!

1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. Your app will be live at: `https://murshid-[random].vercel.app`

## 🔄 Automatic Deployments

After initial setup, every time you push to GitHub:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Vercel will automatically:
1. Detect the push
2. Build your frontend
3. Deploy if successful
4. Send you a deployment notification

## 🌐 Custom Domain (Optional)

1. Go to your Vercel project
2. Click **Settings** → **Domains**
3. Add your domain (e.g., `murshid.com`)
4. Update your domain's DNS settings as instructed
5. Wait for DNS propagation (5-30 minutes)

### Update Supabase After Adding Domain

1. Go to Supabase Dashboard
2. **Authentication** → **URL Configuration**
3. Update **Site URL** to your new domain
4. Add to **Redirect URLs**:
   - `https://murshid-[random].vercel.app/*`
   - `https://your-custom-domain.com/*` (if using)

## ✅ Post-Deployment Checklist

After deployment, test:

- [ ] Open your Vercel URL
- [ ] Homepage loads correctly
- [ ] Navigate to `/login` - Login page works
- [ ] Navigate to `/signup` - Signup page works
- [ ] Create a new account (signup)
- [ ] Login with the account
- [ ] Go to `/profile` - Profile page loads
- [ ] Edit and save profile - Changes persist
- [ ] Logout works
- [ ] Login as admin (if created) - Redirects to `/admin`
- [ ] Admin dashboard shows users
- [ ] No console errors (F12)

## 🐛 Troubleshooting

### Build Fails

**Check build logs in Vercel:**
1. Go to your project in Vercel
2. Click on the failed deployment
3. Check logs for errors

**Common issues:**
- Missing `package.json` in `Murshid-Frontend/`
- Node modules not installed
- TypeScript errors

**Solution:**
```bash
# Test build locally first
cd Murshid-Frontend
npm install
npm run build
```

### Environment Variables Not Working

**Symptoms:**
- Console shows `undefined` for env vars
- Supabase connection fails

**Solution:**
1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify variables are set
3. Make sure they're set for **Production** environment
4. Redeploy after adding variables

### Blank Page After Deployment

**Check:**
1. Press F12 → Console tab
2. Look for errors
3. Common causes:
   - Environment variables missing
   - Wrong Supabase URL
   - CORS issues

**Solution:**
```javascript
// Test in deployed site console
console.log(import.meta.env.VITE_SUPABASE_URL)
// Should show your Supabase URL, not undefined
```

### Routes Return 404

**This shouldn't happen with our config, but if it does:**

1. Verify `vercel.json` is at the root of your repo
2. Check the rewrites section in `vercel.json`
3. Redeploy

## 📊 Monitoring

### View Deployment Logs

1. Vercel Dashboard → Your Project
2. Click on any deployment
3. View real-time logs

### Analytics (Optional)

Vercel provides free analytics:
1. Project Settings → Analytics
2. Enable Web Analytics
3. See visitor metrics, page views, etc.

## 🔒 Security

### Supabase RLS

Make sure Row Level Security is enabled:
1. Supabase → Table Editor → profiles
2. Enable RLS
3. Verify policies are active

### Environment Variables

- ✅ Never commit `.env` files
- ✅ Use Vercel environment variables
- ✅ Keep Supabase keys secure
- ✅ Don't expose in client-side code

## 📱 Your Deployment URLs

After deployment, you'll have:

- **Production:** `https://murshid.vercel.app` (or your custom domain)
- **Preview (per branch):** `https://murshid-git-branch-name.vercel.app`
- **Development:** Local `http://localhost:8080`

## 🎉 Success!

Your Murshid app is now live on Vercel!

**What's deployed:**
- ✅ React frontend with Vite
- ✅ Supabase backend/database
- ✅ Admin dashboard
- ✅ User authentication
- ✅ Profile management

**Share your app:**
- Production URL: Check Vercel dashboard
- GitHub: https://github.com/hamza808111/Murshid

---

## 📞 Need Help?

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html)
- Check Vercel build logs for specific errors
- Verify environment variables are set correctly

---

**Created:** October 23, 2025  
**Repository:** hamza808111/Murshid  
**Framework:** React + Vite + Supabase

