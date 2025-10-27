// Track users who have already received welcome message
const welcomedUsers = new Set();

/**
 * Handle incoming messages
 * @param {Object} msg - WhatsApp message object
 */
async function handleMessage(msg) {
    try {
        // Get the contact who sent the message
        const contact = await msg.getContact();
        const chatId = msg.from;
        
        // Send welcome message to new users
        if (!msg.fromMe && !welcomedUsers.has(chatId)) {
            const welcomeMessage = `\n\nHello! Welcome! How can I help you?\n\nAI-powered assistant at your service.`;
            await msg.reply(welcomeMessage);
            
            // Mark this user as welcomed
            welcomedUsers.add(chatId);
            console.log(`✅ Welcome message sent to: ${contact.pushname || chatId}`);
        }
        
        // Handle commands
        if (msg.body === '!ping') {
            await msg.reply('pong');
        }
        
    } catch (error) {
        console.error('❌ Error handling message:', error);
    }
}

module.exports = { handleMessage };
