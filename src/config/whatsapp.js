const { Client, LocalAuth } = require('whatsapp-web.js');

// WhatsApp client configuration
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { 
        headless: true, 
    }
});

// Client event handlers
client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    console.log('Scan this QR code with your WhatsApp to log in');
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

module.exports = client;
