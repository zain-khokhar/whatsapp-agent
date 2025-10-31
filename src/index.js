require('dotenv').config();
const client = require('./config/whatsapp');
const { handleMessage: handleFyp } = require('./handlers/fypHandler');
const { handleMessage: handlePdf } = require('./handlers/pdfsHandler');
const { messageReviewer } = require('./messageViewer');

// Register message handler

client.on('message', async (msg) => {
  await handlePdf(msg); // Pehle PDF check ho
  await handleFyp(msg); // Phir AI logic chale
  await messageReviewer(msg, client);
});

// Initialize WhatsApp client
client.initialize();

console.log('🚀 WhatsApp Agent starting...');
