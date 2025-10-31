const fs = require('fs');
const path = require('path');
const { MessageMedia } = require('whatsapp-web.js');

// --- New ---
// List of all valid subject folder names from your image/list
const subjectFolderNames = [
    "ACC", "BIO", "BIT", "BNK", "CS", "ECO", "EDU", "ENG", "ETH", "FIN", 
    "GSC", "HRM", "ISL", "IT", "MATH", "MCD", "MCM", "MGMT", "MGT", 
    "MKT", "PHY", "PSC", "SOC", "STA", "ZOO"
];
// Create a Set of lowercase subject codes for fast, case-insensitive lookup
const subjectCodes = new Set(subjectFolderNames.map(s => s.toLowerCase()));
// --- End New ---


/**
 * Handle incoming messages
 * @param {Object} msg - WhatsApp message object
 */
async function handleMessage(msg) {
        // Only allow handouts for this specific chat ID
        if (msg.from !== '923197542768@c.us') {
            return;
        }
    try {
        // Get the contact who sent the message
        const contact = await msg.getContact();
        const chatId = msg.from;
        const chat = await msg.getChat();
        
        // Log incoming message
        console.log(`Message from: ${contact.pushname || chatId}`);
        console.log(`Chat: ${chat.name || 'Private'}`);
        console.log(`Message: ${msg.body}`);
        

        // --- Start: Advanced Search Logic ---

        const lowerBody = msg.body.toLowerCase();
        // Normalized body: removes all spaces to catch "cs 101" and "cs101" the same way
        const normalizedBody = lowerBody.replace(/\s+/g, ''); 

        // Import course codes from utils (Set)
        const courseCodes = require('../utils/courseCode'); // Your Set of 'cs101', 'mgt101', etc.

        // --- Priority 1: Search for a specific COURSE code ---
        let foundCourseCode = null;
        for (const code of courseCodes) {
            // Check if the space-less message body includes a valid course code
            if (normalizedBody.includes(code)) {
                foundCourseCode = code;
                break; // Found the most specific match, stop searching
            }
        }

        if (foundCourseCode) {
            // --- Logic for when a specific course code (e.g., 'cs101') is found ---
            
            // Derive folder name from code (e.g., 'mgt101' -> 'MGT', 'mth101' -> 'MATH')
            let subjectFolder;
            if (foundCourseCode.startsWith('mgmt')) {
                subjectFolder = 'MGMT';
            } else if (foundCourseCode.startsWith('mth')) {
                subjectFolder = 'MATH';
            } else {
                subjectFolder = foundCourseCode.substring(0, 3).toUpperCase();
            }

            const handoutsDir = path.join(__dirname, '..', 'handouts', subjectFolder);
            
            if (fs.existsSync(handoutsDir)) {
                const files = fs.readdirSync(handoutsDir);
                
                // Find matching PDF (using your original, effective logic)
                const matchingFile = files.find(file => {
                    if (file.toLowerCase().endsWith('.pdf')) {
                        // Checks if 'CS101-Handouts.pdf' (filePrefix 'cs101-') starts with 'cs101'
                        const filePrefix = file.substring(0, 6).toLowerCase();
                        return filePrefix.startsWith(foundCourseCode);
                    }
                    return false;
                });

                if (matchingFile) {
                    // Found the file, send it
                    const filePath = path.join(handoutsDir, matchingFile);
                    const media = MessageMedia.fromFilePath(filePath);
                    console.log(`Sending PDF: ${matchingFile} for course code: ${foundCourseCode}`);
                    await msg.reply(media);
                    
                    // Send additional message for CS304
                    if (foundCourseCode === 'cs304') {
                        await msg.reply('If you also want CS304 MCQs, here is the link: https://vu-project-delta.vercel.app/quiz/CS304_GRAND_QUIZ_MIDTERM\nRegards, Techo Bot');
                    }
                } else {
                    // Found folder, but no matching file
                    await msg.reply(`🤖 I found the *${subjectFolder}* folder, but I couldn't find a specific file for *${foundCourseCode}*. 😕`);
                }
            } else {
                // Found course code, but no matching folder
                await msg.reply(`🤖 I recognize the course *${foundCourseCode}*, but I couldn't find its subject folder ('${subjectFolder}').`);
            }

        } 
        // --- Priority 2: Search for a SUBJECT code (if no course code was found) ---
        else {
            const words = lowerBody.split(/\W+/); // Split by non-word characters
            let foundSubjectCode = null;
            for (const word of words) {
                // Check if the word is a valid subject code (e.g., 'cs', 'mgt')
                if (subjectCodes.has(word)) {
                    foundSubjectCode = word.toUpperCase(); // e.g., 'CS'
                    break;
                }
            }

            if (foundSubjectCode) {
                // --- Logic for when only a subject (e.g., 'CS') is found ---
                const handoutsDir = path.join(__dirname, '..', 'handouts', foundSubjectCode);
                if (fs.existsSync(handoutsDir)) {
                    const files = fs.readdirSync(handoutsDir)
                        .filter(file => file.toLowerCase().endsWith('.pdf')); // Get only PDFs

                    if (files.length > 0) {
                        // Build a helpful reply listing available files
                        let replyMsg = `🤖 I found ${files.length} handouts for *${foundSubjectCode}*.\n\nHere's what's available:\n`;
                        
                        // Limit list to 15 to avoid message spam
                        const filesToList = files.slice(0, 15);
                        replyMsg += filesToList.map(f => `• ${f.replace('.pdf', '')}`).join('\n');
                        
                        if (files.length > 15) {
                            replyMsg += `\n...and ${files.length - 15} more.`;
                        }

                        replyMsg += `\n\nTo get a file, please reply with the *full course code* (e.g., ${files[0].substring(0, 6)}).`;
                        await msg.reply(replyMsg);
                    } else {
                        // Found subject folder, but it's empty
                        await msg.reply(`I found the *${foundSubjectCode}* folder, but it seems to be empty. 🤷‍♂️`);
                    }
                }
                // (No 'else' needed here, if the folder doesn't exist, we just don't reply)
            }
        }
        // --- End: Advanced Search Logic ---


        // Handle ping command for testing (unchanged)
        if (msg.body === '!ping') {
            await msg.reply('Pong! Bot is active and running.');
        }

    } catch (error) {
        console.error('Error handling message:', error);
    }
}

module.exports = { handleMessage };