const { Client , LocalAuth } = require('whatsapp-web.js');
const  qrcode = require('qrcode-terminal');
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {headless:false}
});

client.on('qr', (qr) => {
    // Generate and scan this QR code with your phone to log in
    // qrcode.generate(qr,{small:true});
    console.log('QR RECEIVED', qr);
});

client.on('ready', () => {
    console.log('Client is ready!');
});

// Track users who have already received welcome message
const welcomedUsers = new Set();

client.on('message', async msg => {
    // Get the contact who sent the message
    const contact = await msg.getContact();
    const chatId = msg.from;
    
    // Check if this is not from you and user hasn't been welcomed yet
    if (!msg.fromMe && !welcomedUsers.has(chatId)) {
        // Send welcome message
        const welcomeMessage = `\n\nHello! Welcome! How can I help you?/n/nAI-powered assistant at your service.`;
        msg.reply(welcomeMessage);
        
        // Mark this user as welcomed
        welcomedUsers.add(chatId);
        console.log(`Welcome message sent to: ${contact.pushname || chatId}`);
    }
    
    // Handle other commands
    if (msg.body === '!ping') {
        msg.reply('pong');
    }
});

client.initialize();