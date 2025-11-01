const fs = require('fs');
const path = require('path');
const { MessageMedia } = require('whatsapp-web.js');

// List of all valid subject folder names from your image/list
const subjectFolderNames = [
    "ACC", "BIO", "BIT", "BNK", "CS", "ECO", "EDU", "ENG", "ETH", "FIN", 
    "GCS", "HRM", "ISL", "IT", "MATH", "MCD", "MCM", "MGMT", "MGT", 
    "MKT", "PHY", "PSC", "SOC", "STA", "ZOO"
];
// Create a Set of lowercase subject codes for fast, case-insensitive lookup
const subjectCodes = new Set(subjectFolderNames.map(s => s.toLowerCase()));


/**
 * Handle incoming messages
 * @param {Object} msg - WhatsApp message object
 * @returns {boolean} - Returns true if the message was handled, false otherwise
 */
async function handleMessage(msg) {
    // Only allow handouts for this specific chat ID
    if (msg.from !== '923197542768@c.us') {
        // Not the right chat, so we didn't "handle" it.
        // Return false so other handlers (like AI) can process it.
        return false; 
    }

    try {
        // Get the contact who sent the message
        const contact = await msg.getContact();
        const chatId = msg.from;
        const chat = await msg.getChat();
        
        // Log incoming message
        console.log(`[PDF Handler] Message from: ${contact.pushname || chatId}`);
        console.log(`[PDF Handler] Chat: ${chat.name || 'Private'}`);
        console.log(`[PDF Handler] Message: ${msg.body}`);
        
        // --- Start: Advanced Search Logic ---
        const lowerBody = msg.body.toLowerCase();
        const normalizedBody = lowerBody.replace(/\s+/g, ''); // "cs 101" -> "cs101"

        const courseCodes = require('../utils/courseCode');

        // --- Priority 1: Search for a specific COURSE code ---
        let foundCourseCode = null;
        for (const code of courseCodes) {
            if (normalizedBody.includes(code)) {
                foundCourseCode = code;
                break;
            }
        }

        if (foundCourseCode) {
            // --- Logic for when a specific course code (e.g., 'cs101') is found ---
            
            let subjectFolder;
            if (foundCourseCode.startsWith('mgmt')) {
                subjectFolder = 'MGMT';
            } else if (foundCourseCode.startsWith('mth')) {
                subjectFolder = 'MATH';
            } else if (foundCourseCode.startsWith('mgt')) {
                subjectFolder = 'MGT';
            } else if (foundCourseCode.startsWith('eco')) {
                subjectFolder = 'ECO';
            } else if (foundCourseCode.startsWith('eng')) {
                subjectFolder = 'ENG';
            } else if (foundCourseCode.startsWith('acc')) {
                subjectFolder = 'ACC';
            } else if (foundCourseCode.startsWith('sta')) {
                subjectFolder = 'STA';
            } else if (foundCourseCode.startsWith('isl')) {
                subjectFolder = 'ISL';
            } else if (foundCourseCode.startsWith('eth')) {
                subjectFolder = 'ETH';
            } else if (foundCourseCode.startsWith('pak')) {
                subjectFolder = 'PAK';
            } else if (foundCourseCode.startsWith('soc')) {
                subjectFolder = 'SOC';
            } else if (foundCourseCode.startsWith('psy')) {
                subjectFolder = 'PSY';
            } else if (foundCourseCode.startsWith('ece')) {
                subjectFolder = 'ECE';
            } else if (foundCourseCode.startsWith('edu')) {
                subjectFolder = 'EDU';
            } else if (foundCourseCode.startsWith('mcd')) {
                subjectFolder = 'MCD';
            } else if (foundCourseCode.startsWith('hrm')) {
                subjectFolder = 'HRM';
            } else if (foundCourseCode.startsWith('zoo')) {
                subjectFolder = 'ZOO';
            } else if (foundCourseCode.startsWith('mkt')) {
                subjectFolder = 'MKT';
            } else if (foundCourseCode.startsWith('bio')) {
                subjectFolder = 'BIO';
            } else if (foundCourseCode.startsWith('bnk')) {
                subjectFolder = 'BNK';
            } else if (foundCourseCode.startsWith('fin')) {
                subjectFolder = 'FIN';
            } else if (foundCourseCode.startsWith('gsc')) {
                subjectFolder = 'GSC';
            } else if (foundCourseCode.startsWith('mcm')) {
                subjectFolder = 'MCM';
            } else if (foundCourseCode.startsWith('it')) {
                subjectFolder = 'IT';
            } else if (foundCourseCode.startsWith('cs')) {
                subjectFolder = 'CS';
            } else {
                subjectFolder = foundCourseCode.substring(0, 3).toUpperCase();
            }

            const handoutsDir = path.join(__dirname, '..', 'handouts', subjectFolder);
            
            if (fs.existsSync(handoutsDir)) {
                const files = fs.readdirSync(handoutsDir);
                
                // --- Updated File Matching Logic ---
                // Match files based on the course code (case-insensitive)
                const matchingFile = files.find(file => {
                    if (file.toLowerCase().endsWith('.pdf')) {
                        // Extract the course code from filename: "CS101 handouts.pdf" -> "cs101"
                        const fileNameLower = file.toLowerCase();
                        const normalizedFileName = fileNameLower.replace(/[^a-z0-9]/g, '');
                        
                        // Check if normalized filename starts with the course code
                        // e.g., "cs101handoutspdf" starts with "cs101"
                        return normalizedFileName.startsWith(foundCourseCode);
                    }
                    return false;
                });
                // --- End Updated Logic ---

                if (matchingFile) {
                    const filePath = path.join(handoutsDir, matchingFile);
                    const media = MessageMedia.fromFilePath(filePath);
                    console.log(`[PDF Handler] Sending PDF: ${matchingFile} for code: ${foundCourseCode}`);
                    await msg.reply(media);
                    
                    if (foundCourseCode === 'cs304') {
                        await msg.reply('If you also want CS304 MCQs, here is the link: https://vu-project-delta.vercel.app/quiz/CS304_GRAND_QUIZ_MIDTERM\nRegards, Techo Bot');
                    }
                    return true; // <-- We handled the message
                } else {
                    await msg.reply(`🤖 I found the *${subjectFolder}* folder, but I couldn't find a specific file for *${foundCourseCode.toUpperCase()}*. 😕`);
                    return true; // <-- We handled the message (by replying)
                }
            } else {
                await msg.reply(`🤖 I recognize the course *${foundCourseCode.toUpperCase()}*, but I couldn't find its subject folder ('${subjectFolder}').`);
                return true; // <-- We handled the message (by replying)
            }
        } 
        // --- Priority 2: Search for a SUBJECT code (if no course code was found) ---
        else {
            const words = lowerBody.split(/\W+/);
            let foundSubjectCode = null;
            for (const word of words) {
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
                        .filter(file => file.toLowerCase().endsWith('.pdf'));

                    if (files.length > 0) {
                        let replyMsg = `🤖 I found ${files.length} handouts for *${foundSubjectCode}*.\n\nHere's what's available:\n`;
                        const filesToList = files.slice(0, 15);
                        replyMsg += filesToList.map(f => `• ${f.replace('.pdf', '')}`).join('\n');
                        
                        if (files.length > 15) {
                            replyMsg += `\n...and ${files.length - 15} more.`;
                        }
                        replyMsg += `\n\nTo get a file, please reply with the *full course code* (e.g., ${files[0].substring(0, 6)}).`;
                        await msg.reply(replyMsg);
                        return true; // <-- We handled the message (by sending a list)
                    } else {
                        await msg.reply(`I found the *${foundSubjectCode}* folder, but it seems to be empty. 🤷‍♂️`);
                        return true; // <-- We handled the message (by replying)
                    }
                }
                // If subject folder doesn't exist, do nothing and fall through to 'return false'
            }
        }
        // --- End: Advanced Search Logic ---

        // Handle ping command for testing
        if (msg.body === '!ping') {
            await msg.reply('Pong! Bot is active and running.');
            return true; // <-- We handled the message
        }

        // If no code, no subject, and no ping was found, we did not handle this.
        return false; 

    } catch (error) {
        console.error('[PDF Handler] Error handling message:', error);
        return false; // Return false on error
    }
}

module.exports = { handleMessage };