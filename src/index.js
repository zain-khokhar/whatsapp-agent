require('dotenv').config();
const client = require('./config/whatsapp');
const { handleMessage: handleFyp } = require('./handlers/fypHandler');
const { handleMessage: handlePdf } = require('./handlers/pdfsHandler');

// Register message handler

client.on('message', async (msg) => {
    const pdfHandled = await handlePdf(msg); // First check PDF handler
    
    // Only call AI handler if PDF handler didn't handle the message
    if (!pdfHandled) {
        await handleFyp(msg); 
    }
});

// Initialize WhatsApp client
client.initialize();

console.log('🚀 WhatsApp Agent starting...');
