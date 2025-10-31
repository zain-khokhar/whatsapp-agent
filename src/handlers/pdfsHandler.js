const fs = require('fs');
const path = require('path');
const { MessageMedia } = require('whatsapp-web.js');

/**
 * Handle incoming messages
 * @param {Object} msg - WhatsApp message object
 */
async function handleMessage(msg) {
    try {
        // Get the contact who sent the message
        const contact = await msg.getContact();
        const chatId = msg.from;
        const chat = await msg.getChat();
        
        // Log incoming message
        console.log(`Message from: ${contact.pushname || chatId}`);
        console.log(`Chat: ${chat.name || 'Private'}`);
        console.log(`Message: ${msg.body}`);
        

        // Check for course codes and send PDFs
        const lowerBody = msg.body.toLowerCase();

        // Import course codes from utils (Set)
        const courseCodes = require('../utils/courseCode');

        // Split message into words and check for course code
        const words = lowerBody.split(/\W+/);
        let foundCode = null;
        for (const word of words) {
            if (courseCodes.has(word)) {
                foundCode = word;
                break;
            }
        }

        if (foundCode) {
            const handoutsDir = path.join(__dirname, '..', 'handouts');
            if (fs.existsSync(handoutsDir)) {
                const files = fs.readdirSync(handoutsDir);
                // Find matching PDF by checking first 5-6 characters
                const matchingFile = files.find(file => {
                    if (file.toLowerCase().endsWith('.pdf')) {
                        const filePrefix = file.substring(0, 6).toLowerCase();
                        return filePrefix.startsWith(foundCode);
                    }
                    return false;
                });
                if (matchingFile) {
                    const filePath = path.join(handoutsDir, matchingFile);
                    const media = MessageMedia.fromFilePath(filePath);
                    console.log(`Sending PDF: ${matchingFile} for course code: ${foundCode}`);
                    await msg.reply(media);
                    // Send additional message for CS304
                    if (foundCode === 'cs304') {
                        await msg.reply('If you also want CS304 MCQs, here is the link: https://vu-project-delta.vercel.app/quiz/CS304_GRAND_QUIZ_MIDTERM\nRegards, Techo Bot');
                    }
                }
            }
        }

        // Handle ping command for testing
        if (msg.body === '!ping') {
            await msg.reply('Pong! Bot is active and running.');
        }

    } catch (error) {
        console.error('Error handling message:', error);
    }
}

module.exports = { handleMessage };
