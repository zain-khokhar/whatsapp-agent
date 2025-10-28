require('dotenv').config();
const client = require('./config/whatsapp');
const { handleMessage } = require('./handlers/fypHandler');

// Register message handler
client.on('message', handleMessage);

// Initialize WhatsApp client
client.initialize();

console.log('🚀 WhatsApp Agent starting...');
