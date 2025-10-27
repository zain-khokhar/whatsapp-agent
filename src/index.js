const client = require('./config/whatsapp');
const { handleMessage } = require('./handlers/messageHandlers');

// Register message handler
client.on('message', handleMessage);

// Initialize WhatsApp client
client.initialize();

console.log('🚀 WhatsApp Agent starting...');
