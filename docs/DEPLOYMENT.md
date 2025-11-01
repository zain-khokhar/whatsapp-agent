# Render Deployment Guide

## Prerequisites
- A Render account (https://render.com)
- Your repository pushed to GitHub
- Environment variables ready (GEMINI_API_KEY, etc.)

## Deployment Steps

### 1. Create New Web Service on Render

1. Go to your Render dashboard
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `whatsapp-agent`
4. Configure the following settings:

### 2. Service Configuration

| Setting | Value |
|---------|-------|
| **Name** | `whatsapp-agent` (or your preferred name) |
| **Environment** | `Node` |
| **Region** | Choose closest to you |
| **Branch** | `main` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |

### 3. Environment Variables

Add these in the **Environment** section:

```
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=production
```

### 4. Instance Type

- For testing: **Free** tier is sufficient
- For production: **Starter** or higher recommended (for persistent storage)

### 5. Advanced Settings

**Persistent Disk (IMPORTANT for WhatsApp session)**:
- Mount Path: `/opt/render/project/src/.wwebjs_auth`
- Size: 1 GB is sufficient
- This keeps your WhatsApp session authenticated between deployments

### 6. Deploy

1. Click **"Create Web Service"**
2. Wait for the build to complete
3. Check the **Logs** tab
4. Look for the QR code in the console logs
5. **Scan the QR code** with WhatsApp (Linked Devices → Link a Device)

## Post-Deployment

### Viewing Logs
```bash
# In Render dashboard, go to "Logs" tab
# You'll see the QR code printed in ASCII format
```

### Scanning QR Code
1. Open WhatsApp on your phone
2. Go to **Settings** → **Linked Devices**
3. Tap **"Link a Device"**
4. Scan the QR code from Render logs
5. Your bot will authenticate and start working!

### Monitoring
- Check logs regularly for errors
- Session data is persisted in the disk mount
- The bot will reconnect automatically if disconnected

## Troubleshooting

### QR Code Not Showing?
- Check if `qrcode-terminal` is installed
- Verify logs are displaying correctly in Render dashboard

### Session Lost After Restart?
- Ensure persistent disk is mounted at correct path
- Path should be: `/opt/render/project/src/.wwebjs_auth`

### Bot Not Responding?
- Check environment variables are set correctly
- Verify WhatsApp is still linked (check Linked Devices)
- Review error logs in Render dashboard

### Memory Issues?
- Upgrade to paid tier for more resources
- WhatsApp-web.js requires ~512MB minimum

## Important Notes

⚠️ **Session Persistence**: Without persistent disk, you'll need to scan QR code on every deployment

⚠️ **Free Tier Limitations**: 
- Service spins down after 15 minutes of inactivity
- May need re-authentication after spin down
- Consider paid tier for 24/7 uptime

✅ **Best Practice**: Use Starter tier or higher for production use

## Support

If you encounter issues:
1. Check Render logs first
2. Verify all environment variables
3. Ensure WhatsApp session is active
4. Review this guide again

Happy Deploying! 🚀
