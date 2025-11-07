# Deployment Guide - Nomadly Travel Planner

This guide covers deploying the Nomadly travel itinerary generator to various platforms.

## 🚀 Quick Deploy Options

### Option 1: Vercel (Recommended - Easiest)

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the `travelplanner/travelplanner/project` folder as root

3. **Add Environment Variables**
   - In Vercel project settings → Environment Variables
   - Add all variables from your `.env` file:
     ```
     VITE_SUPABASE_URL
     VITE_SUPABASE_ANON_KEY
     VITE_PLACES_API_PROVIDER
     VITE_PLACES_API_KEY (if using Google)
     VITE_WEATHER_API_KEY (optional)
     VITE_USE_WEATHER_API
     VITE_CURRENCY_API_BASE (optional)
     ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy

**Vercel Advantages:**
- Free tier available
- Automatic HTTPS
- Custom domains
- Automatic deployments on git push
- Builds React/Vite apps automatically

---

### Option 2: Netlify

1. **Push to GitHub** (same as Vercel step 1)

2. **Import to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect GitHub and select your repository
   - Set build settings:
     - **Base directory:** `travelplanner/travelplanner/project`
     - **Build command:** `npm run build`
     - **Publish directory:** `travelplanner/travelplanner/project/dist`

3. **Add Environment Variables**
   - Site settings → Environment variables
   - Add all your `.env` variables (same as Vercel)

4. **Deploy**
   - Click "Deploy site"

**Netlify Advantages:**
- Free tier available
- Automatic HTTPS
- Custom domains
- Form handling (if needed)

---

### Option 3: GitHub Pages

1. **Install gh-pages package**
   ```bash
   cd travelplanner/travelplanner/project
   npm install --save-dev gh-pages
   ```

2. **Update package.json**
   Add to scripts:
   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d dist"
   ```
   Add homepage:
   ```json
   "homepage": "https://yourusername.github.io/your-repo-name"
   ```

3. **Update vite.config.ts**
   ```typescript
   export default defineConfig({
     base: '/your-repo-name/',
     // ... rest of config
   })
   ```

4. **Deploy**
   ```bash
   npm run deploy
   ```

**Note:** GitHub Pages doesn't support environment variables directly. You'll need to:
- Use GitHub Secrets and a GitHub Actions workflow, OR
- Hardcode non-sensitive values, OR
- Use a different deployment method

---

### Option 4: Render

1. **Push to GitHub**

2. **Create New Web Service**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect GitHub repository

3. **Configure Build**
   - **Root Directory:** `travelplanner/travelplanner/project`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run preview`
   - **Environment:** Node

4. **Add Environment Variables**
   - In Render dashboard → Environment
   - Add all your `.env` variables

5. **Deploy**
   - Click "Create Web Service"

---

### Option 5: Firebase Hosting

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login and Initialize**
   ```bash
   firebase login
   cd travelplanner/travelplanner/project
   firebase init hosting
   ```
   - Select your Firebase project
   - Public directory: `dist`
   - Single-page app: Yes
   - Don't overwrite index.html

3. **Create firebase.json** (if not auto-created)
   ```json
   {
     "hosting": {
       "public": "dist",
       "ignore": [
         "firebase.json",
         "**/.*",
         "**/node_modules/**"
       ],
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ]
     }
   }
   ```

4. **Build and Deploy**
   ```bash
   npm run build
   firebase deploy
   ```

5. **Set Environment Variables**
   - Use Firebase Functions or hardcode (Firebase Hosting doesn't support env vars directly)

---

## 🛠️ Pre-Deployment Checklist

### 1. Build the Project Locally
```bash
cd travelplanner/travelplanner/project
npm install
npm run build
```

### 2. Test the Build
```bash
npm run preview
```
Visit `http://localhost:4173` and test all features

### 3. Environment Variables
Ensure all required variables are set:
- ✅ Supabase URL and Key
- ✅ Places API provider (and key if using Google)
- ✅ Weather API key (optional)
- ✅ Currency API settings (optional)

### 4. Check API Limits
- Nominatim: 1 request per second (free tier)
- Open-Meteo: No limits (free)
- Exchange Rate API: 1500 requests/month (free tier)
- Google Places: Depends on your billing tier

### 5. Supabase Setup
- Ensure your Supabase project has the `itineraries` table
- Check Row Level Security (RLS) policies
- Verify authenticated users can read/write

---

## 📦 Build Output

After `npm run build`, you'll get:
- `dist/` folder with optimized production build
- All assets minified and bundled
- Ready to deploy to any static hosting

---

## 🔒 Security Considerations

1. **Never commit `.env` file** - Add to `.gitignore`
2. **API Keys** - Use environment variables, never hardcode
3. **Supabase Keys** - Use anon key (public) for client-side, but protect with RLS
4. **CORS** - Ensure your APIs allow requests from your domain

---

## 🌐 Custom Domain Setup

### Vercel/Netlify:
- Go to project settings → Domains
- Add your custom domain
- Follow DNS configuration instructions

### GitHub Pages:
- Repository settings → Pages
- Under "Custom domain", enter your domain
- Configure DNS with your domain provider

---

## 📊 Monitoring & Analytics

Consider adding:
- **Vercel Analytics** - Built-in for Vercel deployments
- **Google Analytics** - Add tracking code to `index.html`
- **Sentry** - Error tracking
- **Supabase Dashboard** - Monitor database usage

---

## 🐛 Troubleshooting

### Build Fails
- Check Node.js version (should be 18+)
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run lint`

### API Errors in Production
- Verify environment variables are set correctly
- Check API keys are valid
- Review CORS settings
- Check browser console for specific errors

### Routing Issues
- Ensure your hosting provider supports SPA routing
- Configure redirects/rewrites for all routes to `index.html`

---

## 📝 Recommended Deployment Order

1. **Start with Vercel** (easiest, free tier)
2. **Test thoroughly** in production
3. **Set up custom domain** when ready
4. **Monitor usage** and API limits
5. **Scale up** if needed (premium tiers)

---

## 🎯 Quick Start (Vercel)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Navigate to project
cd travelplanner/travelplanner/project

# 3. Deploy
vercel

# 4. Follow prompts
# 5. Add environment variables in Vercel dashboard
# 6. Redeploy
vercel --prod
```

Your app will be live at `https://your-project.vercel.app`

---

## 📚 Additional Resources

- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [Supabase Documentation](https://supabase.com/docs)


