const { Client , LocalAuth } = require('whatsapp-web.js');
const  qrcode = require('qrcode-terminal');
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {headless:false}
});

client.on('qr', (qr) => {
    // Generate and scan this QR code with your phone to log in
    qrcode.generate(qr,{small:true});
    console.log('QR RECEIVED', qr);
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', msg => {
    if (msg.body === '!ping') {
        msg.reply('pong');
    }
});

client.initialize();