# 🚀 Render Deployment Checklist

## Before Deployment

- [ ] All code pushed to GitHub
- [ ] `.env` file NOT committed (check `.gitignore`)
- [ ] `GEMINI_API_KEY` ready
- [ ] Dependencies up to date (`npm install`)
- [ ] Code tested locally

## Render Configuration

### Service Settings
- [ ] Service Type: **Web Service**
- [ ] Environment: **Node**
- [ ] Build Command: `npm install`
- [ ] Start Command: `npm start`
- [ ] Branch: `main`

### Environment Variables (Critical!)
```
GEMINI_API_KEY=your_actual_key_here
NODE_ENV=production
```

### Instance Type
- [ ] **Free** tier for testing
- [ ] **Starter** or higher for production (recommended)

### Persistent Disk (IMPORTANT!)
- [ ] Create persistent disk
- [ ] Mount path: `.wwebjs_auth`
- [ ] Size: 1 GB minimum
- [ ] **This prevents re-authentication on every restart!**

## Deployment Steps

1. [ ] Create new Web Service on Render
2. [ ] Connect GitHub repository
3. [ ] Configure build & start commands
4. [ ] Add environment variables
5. [ ] Set up persistent disk
6. [ ] Click "Create Web Service"
7. [ ] Wait for build to complete (~3-5 minutes)

## Post-Deployment

### Authentication
1. [ ] Go to **Logs** tab in Render dashboard
2. [ ] Look for QR code in console (ASCII format)
3. [ ] Open WhatsApp → Settings → Linked Devices
4. [ ] Tap "Link a Device"
5. [ ] Scan the QR code from logs
6. [ ] Wait for "✅ WhatsApp Client is ready!" message

### Verification
- [ ] Check logs for "✅ WhatsApp Client is ready!"
- [ ] Visit health endpoint: `https://your-app.onrender.com/health`
- [ ] Send a test message with course code (e.g., "cs101")
- [ ] Verify PDF is sent correctly
- [ ] Test AI with "neuro" in message

### Monitoring
- [ ] Bookmark Render dashboard
- [ ] Set up email notifications in Render
- [ ] Monitor logs regularly
- [ ] Check WhatsApp "Linked Devices" periodically

## Common Issues & Solutions

### ❌ QR Code Not Visible
**Solution:** 
- Check logs are displaying properly
- Scroll up in logs tab
- Wait 30 seconds after deployment starts

### ❌ Session Lost After Restart
**Solution:**
- Verify persistent disk is mounted correctly
- Path must be `.wwebjs_auth` (relative path)
- Check disk is attached in Render dashboard

### ❌ "Module not found" Error
**Solution:**
- Ensure `npm install` completes successfully
- Check build logs for errors
- Verify `package.json` has all dependencies

### ❌ Service Keeps Restarting
**Solution:**
- Check for uncaught errors in logs
- Verify environment variables are set
- Increase instance resources (upgrade tier)

### ❌ Bot Not Responding to Messages
**Solution:**
- Verify WhatsApp is still linked (check phone)
- Check if group ID matches in `pdfsHandler.js`
- Review error logs for specific issues

## Performance Tips

✅ **Use Starter Tier or Higher**
- Free tier spins down after 15 min inactivity
- Causes session disconnections
- Starter tier ($7/month) = 24/7 uptime

✅ **Enable Persistent Disk**
- Saves WhatsApp session between restarts
- No need to scan QR code again
- Essential for production use

✅ **Monitor Memory Usage**
- WhatsApp-web.js uses ~300-500MB
- Upgrade if you see memory errors
- Check metrics in Render dashboard

## Security Checklist

- [ ] `.env` file in `.gitignore`
- [ ] API keys stored as environment variables
- [ ] No sensitive data in code
- [ ] `.wwebjs_auth` folder in `.gitignore`
- [ ] Session data on persistent disk only

## Support Resources

- **Render Docs:** https://render.com/docs
- **WhatsApp-web.js:** https://wwebjs.dev/
- **Your Logs:** Check Render dashboard regularly

## Success Indicators

✅ Build completes without errors
✅ QR code appears in logs
✅ WhatsApp successfully linked
✅ "✅ WhatsApp Client is ready!" in logs
✅ Health endpoint returns `200 OK`
✅ Test messages work correctly
✅ Bot responds to course codes
✅ AI responds to "neuro"

---

**Ready to deploy?** Follow the detailed guide in `DEPLOYMENT.md`

Good luck! 🎉
