require('dotenv').config();
const client = require('./config/whatsapp');
const { handleMessage } = require('./handlers/fypHandler');
const { messageReviewer } = require('./messageViewer');

// Register message handler
client.on('message', async (msg) => {
  // Run FYP handler as before
  await handleMessage(msg);
  // Run messageReviewer for gatekeeping
  await messageReviewer(msg, client);
});

// Initialize WhatsApp client
client.initialize();

console.log('🚀 WhatsApp Agent starting...');
