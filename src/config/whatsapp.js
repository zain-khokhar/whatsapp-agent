const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// WhatsApp client configuration
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './.wwebjs_auth'
    }),
    puppeteer: { 
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-extensions',
            '--no-first-run',
            '--disable-default-apps',
            '--disable-sync'
        ]
    }
});

// Client event handlers
client.on('qr', (qr) => {
    console.log('📱 QR Code received!');
    console.log('═'.repeat(60));
    console.log('🔗 Open this URL in browser to scan:');
    console.log(`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qr)}`);
    console.log('═'.repeat(60));
    console.log('💡 Open WhatsApp > Linked Devices > Link a Device');
});

client.on('ready', () => {
    console.log('✅ WhatsApp Client is ready!');
});

client.on('authenticated', () => {
    console.log('✅ Client authenticated successfully');
});

client.on('auth_failure', (msg) => {
    console.error('❌ Authentication failed:', msg);
});

client.on('disconnected', (reason) => {
    console.log('⚠️ Client was disconnected:', reason);
});

module.exports = client;
