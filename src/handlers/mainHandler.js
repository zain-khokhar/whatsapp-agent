const { getAIResponse } = require('../services/aiServices');
const pdfsHandler = require('./pdfsHandler');
const fypHandler = require('./fypHandler');

/**
 * Main handler: Uses Gemini to review message and route to correct handler
 * @param {Object} msg - WhatsApp message object
 */
async function handleMessage(msg) {
    try {
        // Step 1: Ask Gemini to review the message and return 'handout' or 'ai'
        const reviewPrompt = `A student sent this message: "${msg.body}"\nIf the message is asking for a handout or PDF, reply with only the word 'handout'.\nIf the message is an academic question or needs explanation, reply with only the word 'ai'.\nReply with only one word: 'handout' or 'ai'.`;
        const reviewResult = await getAIResponse(reviewPrompt);
        console.log('Gemini Review Result:', reviewResult);
        const review = reviewResult.trim().toLowerCase();
        console.log('--- Gemini Query Review ---');
        console.log('User Message:', msg.body);
        console.log('Gemini Review Response:', review);
        console.log('--------------------------');

        if (review === 'handout') {
            // Route to handout handler
            await pdfsHandler.handleMessage(msg);
        } else if (review === 'ai') {
            // Route to AI handler
            await fypHandler.handleMessage(msg);
        } else {
            // Fallback: Could not determine
            await msg.reply('Sorry, I could not understand your request. Please clarify if you want a handout or have a question.');
        }
    } catch (error) {
        console.error('Main handler error:', error);
        await msg.reply('Sorry, an error occurred while processing your request.');
    }
}

module.exports = { handleMessage };