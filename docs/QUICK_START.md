# 🚀 Quick Deploy to Render - 5 Minutes!

## Step 1: Push to GitHub (1 min)
```bash
git add .
git commit -m "Deploy to Render"
git push origin main
```

## Step 2: Create Service on Render (2 min)

1. Go to https://render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo: `whatsapp-agent`
4. Fill in:
   - **Name:** `whatsapp-agent`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

## Step 3: Add Environment Variables (1 min)

Click **"Add Environment Variable"** and add:

```
GEMINI_API_KEY = your_gemini_api_key_here
NODE_ENV = production
```

## Step 4: Add Persistent Disk (CRITICAL!) (1 min)

⚠️ **Don't skip this!** Without it, you'll scan QR every restart.

1. Scroll to **"Disk"** section
2. Click **"Add Disk"**
3. **Name:** `whatsapp-session`
4. **Mount Path:** `.wwebjs_auth`
5. **Size:** 1 GB

## Step 5: Deploy! (30 sec)

1. Click **"Create Web Service"**
2. Wait for build (3-5 minutes)
3. Watch the logs...

## Step 6: Scan QR Code (30 sec)

Once deployed:
1. Go to **"Logs"** tab
2. You'll see QR code like this:
   ```
   █▀▀▀▀▀█ █▀█ █▄▄█▀ █▀▀▀▀▀█
   █ ███ █ ▀▀▄▀ ▄▀█ █ ███ █
   ...
   ```
3. Open WhatsApp on your phone
4. Go to: **Settings → Linked Devices → Link a Device**
5. **Scan the QR code from Render logs**
6. Done! ✅

## Verify It Works

**Check logs for:**
```
✅ Client authenticated successfully
✅ WhatsApp Client is ready!
```

**Test the bot:**
- Send "cs101" in your WhatsApp group
- Should receive CS101 handout PDF!

**Check health:**
- Visit: `https://your-app-name.onrender.com/health`
- Should see: `"whatsappConnected": true`

## 🎉 That's It!

Your bot is now:
- ✅ Running 24/7 (if paid tier)
- ✅ Sending PDFs automatically
- ✅ Responding to "neuro" with AI
- ✅ Session persisted (no re-scan needed)

## Need More Details?

- Full guide: `DEPLOYMENT.md`
- Checklist: `DEPLOYMENT_CHECKLIST.md`
- Summary: `DEPLOYMENT_SUMMARY.md`

## Pro Tips 💡

1. **Use Starter Tier ($7/month)** for 24/7 uptime
2. **Free tier** spins down after 15 min inactivity
3. **Bookmark Render dashboard** for quick access
4. **Check logs** if anything seems off

---

**Total Time: ~5 minutes** ⏱️

**You're ready to go live! 🚀**
