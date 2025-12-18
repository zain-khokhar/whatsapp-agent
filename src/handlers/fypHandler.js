const { getAIResponse } = require('../services/whatsappAI');
const { isValidQuestion, formatResponse } = require('../utils/helpers');

/**
 * Handle incoming messages
 * @param {Object} msg - WhatsApp message object
 * @param {Object} client - WhatsApp client instance
 */
async function handleMessage(msg, client) {
    
    try {
        // Only process if message contains 'zeno' (case-insensitive)
        if (!msg.body || !msg.body.toLowerCase().includes('zeno')) {
            return;
        }

        // Get chat information
        const chatId = msg.from;
        const chat = await msg.getChat();

        // Log incoming message
        console.log(`[FYP Handler] Message from: ${chatId}`);
        console.log(`[FYP Handler] Chat: ${chat.name || 'Private'}`);
        console.log(`[FYP Handler] Message: ${msg.body}`);

        // Validate if it's a formal question
        if (!isValidQuestion(msg)) {
            console.log('[FYP Handler] Invalid message format - skipping AI response');
            return;
        }

        // Show typing indicator
        await chat.sendStateTyping();

        // Get AI response from Copilot
        try {
            console.log(`[FYP Handler] Processing with Copilot AI...`);
            const aiResponse = await getAIResponse(client, msg.body);
            
            // Only send response if it's not an error message
            if (aiResponse && !aiResponse.startsWith('Sorry,')) {
                const formattedResponse = formatResponse(aiResponse);
                await msg.reply(formattedResponse);
                console.log(`[FYP Handler] AI response sent successfully`);
            } else {
                // Log error but don't send to user
                console.log(`[FYP Handler] AI response failed or quota exceeded - not sending to user`);
            }
            console.log('─'.repeat(50));
        } catch (error) {
            console.error('[FYP Handler] AI response failed:', error.message);
            // Don't send error message to user
        }

        // Handle ping command for testing
        if (msg.body === '!ping') {
            await msg.reply('🏓 Pong! Bot is active and running.');
        }
    } catch (error) {
        console.error('[FYP Handler] Error handling message:', error);
    }
}

module.exports = { handleMessage };
