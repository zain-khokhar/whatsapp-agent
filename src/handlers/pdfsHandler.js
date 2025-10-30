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
        
        if (msg.body.startsWith('techo ')) {
            const replyText = msg.body.slice(6);
            await msg.reply(replyText);
            return;
        }

        // Check for course codes and send PDFs
        const lowerBody = msg.body.toLowerCase();

        // List of all valid course codes
        const courseCodes = [
            'cs101', 'cs201', 'cs202', 'cs301', 'cs302', 'cs304', 'cs311',
            'cs401', 'cs403', 'cs501', 'cs502', 'cs506', 'cs507', 'cs508',
            'cs510', 'cs601', 'cs602', 'cs603', 'cs604', 'cs605', 'cs606',
            'cs609', 'cs610', 'cs614', 'cs615', 'cs619'
        ];

        // Check if message contains any course code
        for (const code of courseCodes) {
            if (lowerBody.includes(code)) {
                const handoutsDir = path.join(__dirname, '..', 'handouts');

                // Read all PDF files in handouts directory
                if (fs.existsSync(handoutsDir)) {
                    const files = fs.readdirSync(handoutsDir);

                    // Find matching PDF by checking first 5-6 characters
                    const matchingFile = files.find(file => {
                        if (file.toLowerCase().endsWith('.pdf')) {
                            const filePrefix = file.substring(0, 6).toLowerCase();
                            return filePrefix.startsWith(code);
                        }
                        return false;
                    });

                    if (matchingFile) {
                        const filePath = path.join(handoutsDir, matchingFile);
                        const media = MessageMedia.fromFilePath(filePath);
                        console.log(`Sending PDF: ${matchingFile} for course code: ${code}`);
                        await msg.reply(media);

                        // Send additional message for CS304
                        if (code === 'cs304') {
                            await msg.reply('If you also want CS304 MCQs, here is the link: https://vu-project-delta.vercel.app/quiz/CS304_GRAND_QUIZ_MIDTERM\nRegards, Techo Bot');
                        }
                    }
                }
                break; // Stop after finding first match
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
