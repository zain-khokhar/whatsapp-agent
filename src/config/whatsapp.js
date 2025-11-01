const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// WhatsApp client configuration
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './.wwebjs_auth'
    }),
    puppeteer: { 
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

// Client event handlers
client.on('qr', (qr) => {
    console.log('📱 QR Code received! Scan this with your WhatsApp:');
    console.log('═'.repeat(50));
    qrcode.generate(qr, { small: true });
    console.log('═'.repeat(50));
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
