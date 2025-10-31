require('dotenv').config();
const client = require('./config/whatsapp');
const { handleMessage: handleFyp } = require('./handlers/fypHandler');
const { handleMessage: handlePdf } = require('./handlers/pdfsHandler');
const { messageReviewer } = require('./messageViewer');

// Register message handler

client.on('message', async (msg) => {
 const pdfHandled = await handlePdf(msg); // Pehle PDF check ho
  await handleFyp(msg); // Phir AI logic chale
 if (!pdfHandled) {
        await handleFyp(msg); 
    }
    
    // Ye messageReviewer har haal mein chalega
    await messageReviewer(msg, client);
});

// Initialize WhatsApp client
client.initialize();

console.log('🚀 WhatsApp Agent starting...');
