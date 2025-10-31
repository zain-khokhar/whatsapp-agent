const { getAIResponse } = require('../services/aiServices');
const { isValidQuestion, formatResponse } = require('../utils/helpers');

/**
 * Handle incoming messages
 * @param {Object} msg - WhatsApp message object
 */
async function handleMessage(msg) {
    try {
        // Only process if message contains 'neuro' (case-insensitive)
        if (!msg.body || !msg.body.toLowerCase().includes('neuro')) {
            return;
        }
        // Get the contact who sent the message
        const contact = await msg.getContact();
        const chatId = msg.from;
        const chat = await msg.getChat();
        // Log incoming message
        console.log(` Message from: ${chatId}`);
        console.log(` Chat: ${chat.name || 'Private'}`);
        console.log(` Message: ${msg.body}`);

        // Handle messages from specific group/chat only
        if (!msg.fromMe && msg.from === '923197542768@c.us') {
            // Validate if it's a formal question
            if (!isValidQuestion(msg)) {
                console.log(' Invalid message format - skipping AI response');
                return;
            }
            // Show typing indicator
            await chat.sendStateTyping();
            // Get AI response
            try {
                console.log(` Processing with AI...`);
                const aiResponse = await getAIResponse(msg.body);
                const formattedResponse = formatResponse(aiResponse);
                await msg.reply(formattedResponse);
                console.log(` AI response sent successfully`);
                console.log('─'.repeat(50));
            } catch (error) {
                console.error(' AI response failed:', error.message);
                await msg.reply('Sorry, I am having trouble processing your request right now. Please try again in a moment.');
            }
        }
        // Handle ping command for testing
        if (msg.body === '!ping') {
            await msg.reply(' Pong! Bot is active and running.');
        }
    } catch (error) {
        console.error(' Error handling message:', error);
    }
}

module.exports = { handleMessage };











// import { getAIResponse } from '../services/aiServices.js';
// import { isValidQuestion, formatResponse } from '../utils/helpers.js';

// /**
//  * Handle incoming messages
//  * @param {Object} msg - WhatsApp message object
//  */
// async function handleMessage(msg) {
//     try {
//         // Get the contact who sent the message
//         const contact = await msg.getContact();
//         const chatId = msg.from;
//         const chat = await msg.getChat();
        

        
//         // Handle messages from specific group/chat only
//         if (!msg.fromMe && msg.from === '923175416388@c.us') {
//             // Validate if it's a formal question
//              // Log incoming message
//         console.log(` Message from: ${ chatId}`);
//         console.log(` Chat: ${chat.name || 'Private'}`);
//         console.log(` Message: ${msg.body}`);

//             if (!isValidQuestion(msg)) {
//                 console.log(' Invalid message format - skipping AI response');
//                 return;
//             }
//              console.log(' Valid message format - processing with AI');
//             // Show typing indicator
//             await chat.sendStateTyping();

//             // Get AI response
//             try {
//                 console.log(` Processing with AI...`);
//                 const aiResponse = await getAIResponse();
//                 const formattedResponse = formatResponse(aiResponse);
                
//                 await msg.reply(formattedResponse);
//                 console.log(` AI response sent successfully`);
//                 console.log('─'.repeat(50));
//             } catch (error) {
//                 console.error(' AI response failed:', error.message);
//                 await msg.reply('Sorry, I am having trouble processing your request right now. Please try again in a moment.');
//             }
//         }
        
//         // Handle ping command for testing
//         if (msg.body === '!ping') {
//             await msg.reply(' Pong! Bot is active and running.');
//         }
        
//     } catch (error) {
//         console.error(' Error handling message:', error);
//     }
// }

// module.exports = { handleMessage };
