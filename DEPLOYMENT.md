# MacMan Backend v2 - Deployment Guide

## 🚀 Quick Deploy to Railway

### Prerequisites
- GitHub account
- Railway account (free tier available)

### Steps

1. **Push to GitHub:**
```bash
cd backend-v2
git init
git add .
git commit -m "Initial commit - MacMan Backend v2"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/macman-backend-v2.git
git push -u origin main
```

2. **Deploy to Railway:**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your `macman-backend-v2` repository
   - Railway will auto-detect the configuration

3. **Add PostgreSQL:**
   - In your Railway project, click "New" → "Database" → "Add PostgreSQL"
   - Railway automatically sets `DATABASE_URL`

4. **Set Environment Variables:**
   - Go to "Variables" tab
   - Add these variables:
     ```
     NODE_ENV=production
     JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
     ADMIN_SECRET=your-admin-secret-key-16chars
     ALLOWED_ORIGINS=https://macman.dev,https://www.macman.dev
     ```

5. **Deploy:**
   - Railway will automatically deploy
   - Your API will be available at: `https://macman-backend-v2.up.railway.app`

6. **Initialize Database:**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login
   railway login
   
   # Link to your project
   railway link
   
   # Run migration
   railway run npx prisma db push
   ```

7. **Test:**
   - Health: `https://your-app.up.railway.app/health`
   - Admin: `https://your-app.up.railway.app/admin`

---

## ✈️ Alternative: Deploy to Fly.io (FREE Tier)

### Prerequisites
- Fly.io account (credit card required but free tier available)

### Steps

1. **Install Fly CLI:**
```bash
curl -L https://fly.io/install.sh | sh
```

2. **Login:**
```bash
fly auth login
```

3. **Launch App:**
```bash
cd backend-v2
fly launch
```

Follow prompts:
- App name: `macman-backend-v2`
- Region: Choose closest to your users
- PostgreSQL: Yes (choose free tier)
- Redis: No

4. **Set Secrets:**
```bash
fly secrets set \
  JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long \
  ADMIN_SECRET=your-admin-secret-key-16chars \
  ALLOWED_ORIGINS=https://macman.dev,https://www.macman.dev
```

5. **Create Volume for Uploads:**
```bash
fly volumes create macman_uploads --size 1  # 1GB free
```

6. **Deploy:**
```bash
fly deploy
```

7. **Initialize Database:**
```bash
fly ssh console
cd /app
npx prisma db push
exit
```

8. **Test:**
   - Health: `https://macman-backend-v2.fly.dev/health`
   - Admin: `https://macman-backend-v2.fly.dev/admin`

---

## 🔧 Post-Deployment

### Update Swift App

Update the backend URL in your Swift app:

**File:** `MacManAA/MacManAA/LicenseManager.swift`

```swift
// OLD
guard let url = URL(string: "https://macman-backend-railway-production.up.railway.app/api/validate-key") else {

// NEW
guard let url = URL(string: "https://your-new-backend-url.up.railway.app/api/licenses/validate") else {
```

**File:** `MacManAA/MacManAA/UpdateManagerV2.swift`

```swift
// Update check endpoint
guard let url = URL(string: "https://your-new-backend-url.up.railway.app/api/v2/updates/check") else {
```

### Update Landing Page

**File:** `landing-page/macman-storage-hero/src/components/MacManLanding.tsx`

If you have any direct API calls to the backend, update them with the new URL.

### Test Everything

1. **License Validation:**
```bash
curl -X POST https://your-backend-url/api/licenses/validate \
  -H "Content-Type: application/json" \
  -d '{
    "license_key": "MACMAN-XXXXX-XXXXX-XXXXX",
    "machine_id": "test-machine"
  }'
```

2. **Update Check:**
```bash
curl "https://your-backend-url/api/v2/updates/check?version=1.0.0&userId=test&platform=darwin"
```

3. **Admin Dashboard:**
   - Open: `https://your-backend-url/admin`
   - Login with your `ADMIN_SECRET`
   - Create a test license
   - Verify it appears in the list

### Create First Admin License

```bash
curl -X POST https://your-backend-url/api/admin/licenses \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: your-admin-secret" \
  -d '{
    "email": "admin@macman.dev",
    "plan": "Enterprise"
  }'
```

---

## 📊 Monitoring

### Railway
- Go to your project dashboard
- View logs in real-time
- Monitor CPU/Memory usage
- Set up custom domains

### Fly.io
```bash
# View logs
fly logs

# Check status
fly status

# Monitor metrics
fly dashboard
```

---

## 🔒 Security Checklist

- ✅ Set strong `JWT_SECRET` (32+ characters)
- ✅ Set strong `ADMIN_SECRET` (16+ characters)
- ✅ Configure `ALLOWED_ORIGINS` properly
- ✅ Enable HTTPS (automatic on Railway/Fly.io)
- ✅ Keep dependencies updated
- ✅ Monitor logs for suspicious activity

---

## 💰 Cost Estimate

### Railway (Recommended)
- **Hobby Plan:** $5/month
- Includes: PostgreSQL, 500 hours/month, persistent storage
- Perfect for side projects

### Fly.io (Free Tier Available)
- **Free Tier:** $0/month
- Includes: 3 shared-cpu-1x VMs, 160GB bandwidth
- Sufficient for small-scale projects
- PostgreSQL: $0 for development tier (single VM)

---

## 🆘 Troubleshooting

### Database Connection Issues
```bash
# Railway
railway run npx prisma studio

# Fly.io
fly ssh console
npx prisma studio
```

### Migration Issues
```bash
# Force push schema (use with caution)
npx prisma db push --force-reset
```

### View Logs
```bash
# Railway
railway logs

# Fly.io
fly logs
```

---

## 📝 Next Steps

1. ✅ Deploy backend
2. ✅ Test all endpoints
3. ✅ Update Swift app with new URLs
4. ✅ Rebuild and test MacMan app
5. ✅ Update landing page if needed
6. ✅ Create production licenses
7. ✅ Monitor for issues

---

**Need help?** Check the main README.md for API documentation and examples.

