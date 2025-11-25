const fs = require('fs');
const path = require('path');
const { MessageMedia } = require('whatsapp-web.js');

// List of all valid subject folder names (updated to match 'vu-projects-<SUBJECT>-pdfs')
const subjectFolderNames = [
    "ACC", "BIF", "BIO", "BIT", "BNK", "BT", "CHE", "CS", "ECO", "EDU", "ENG", "ETH", "FIN",
    "GSC", "HRM", "ISL", "IT", "MTH", "MCD", "MCM", "MGMT", "MGT", "MKT", "PAD", "PAK",
    "PHY", "PSC", "SOC", "STA", "URD", "ZOO"
];
// Create a Set of lowercase subject codes for fast, case-insensitive lookup
const subjectCodes = new Set(subjectFolderNames.map(s => s.toLowerCase()));

// Persistent history file for tracking which handout was sent to which chat and when
const HISTORY_DIR = path.join(__dirname, '..', 'data');
const HISTORY_FILE = path.join(HISTORY_DIR, 'handoutHistory.json');
// In-memory cache of history for faster checks
let sendHistory = {};
try {
    if (!fs.existsSync(HISTORY_DIR)) fs.mkdirSync(HISTORY_DIR, { recursive: true });
    if (fs.existsSync(HISTORY_FILE)) {
        sendHistory = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8') || '{}');
    }
} catch (err) {
    console.warn('[PDF Handler] Could not load send history:', err && err.message);
    sendHistory = {};
}

function saveHistory() {
    try {
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(sendHistory, null, 2), 'utf8');
    } catch (err) {
        console.warn('[PDF Handler] Failed to save send history:', err && err.message);
    }
}


/**
 * Handle incoming messages
 * @param {Object} msg - WhatsApp message object
 * @returns {boolean} - Returns true if the message was handled, false otherwise
 */
async function handleMessage(msg) {
    // Previously this handler restricted access to two specific group IDs.
    // The restriction has been removed so handouts can be requested from any group or chat.

    try {
        const chatId = msg.from;
        const chat = await msg.getChat();
        
        // Get contact name from message author or chat name (avoiding deprecated getContact API)
        const contactName = msg._data?.notifyName || chat.name || chatId;
        
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
            
            // Log only relevant handout request messages
            console.log(`[PDF Handler] Handout request from: ${contactName}`);
            console.log(`[PDF Handler] Chat: ${chat.name || 'Private'}`);
            console.log(`[PDF Handler] Message: ${msg.body}`);
            console.log(`[PDF Handler] Course code detected: ${foundCourseCode}`);
            
            // Derive subject code from the start of the course code (letters only)
            let subjectFolder = foundCourseCode.match(/^[a-z]+/i);
            subjectFolder = subjectFolder ? subjectFolder[0].toUpperCase() : foundCourseCode.substring(0, 3).toUpperCase();

            // New folder structure is like 'vu-projects-<SUBJECT>-pdfs'
            const handoutsBase = path.join(__dirname, '..', 'handouts');
            let handoutsDir = null;
            try {
                const folders = fs.readdirSync(handoutsBase).filter(name => fs.statSync(path.join(handoutsBase, name)).isDirectory());
                const match = folders.find(f => f.toLowerCase() === `vu-projects-${subjectFolder.toLowerCase()}-pdfs`);
                if (match) handoutsDir = path.join(handoutsBase, match);
            } catch (err) {
                // If reading directory fails, leave handoutsDir null
                handoutsDir = null;
            }
            
            if (handoutsDir && fs.existsSync(handoutsDir)) {
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
                    // Rate-limit: same handout should only be sent to the same chat once per hour.
                    const chatKey = msg.from; // group or chat id
                    const fileKey = matchingFile; // using filename as identifier
                    const now = Date.now();
                    const ONE_HOUR_MS = 60 * 60 * 1000;

                    // Ensure nested structure exists
                    if (!sendHistory[chatKey]) sendHistory[chatKey] = {};
                    const lastSent = sendHistory[chatKey][fileKey] || 0;

                    if (lastSent && (now - lastSent) < ONE_HOUR_MS) {
                        // Too soon — less than an hour, silently skip sending
                        console.log(`[PDF Handler] Skipping send of ${matchingFile} to ${chatKey} — sent ${Math.round((now - lastSent) / 60000)} minutes ago.`);
                        return true; // still considered handled
                    }

                    // If it has been >= ONE_HOUR_MS or never sent before, send the handout
                    const filePath = path.join(handoutsDir, matchingFile);
                    const media = MessageMedia.fromFilePath(filePath);
                    console.log(`[PDF Handler] Sending PDF: ${matchingFile} for code: ${foundCourseCode} to ${chatKey}`);
                    await msg.reply(media, undefined, { caption: 'Handout sent by AI Agent' });

                    // Update history and persist
                    sendHistory[chatKey][fileKey] = now;
                    saveHistory();

                    return true; // <-- We handled the message
                }
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
                
                // Log only relevant handout request messages
                console.log(`[PDF Handler] Subject request from: ${contactName}`);
                console.log(`[PDF Handler] Chat: ${chat.name || 'Private'}`);
                console.log(`[PDF Handler] Message: ${msg.body}`);
                console.log(`[PDF Handler] Subject code detected: ${foundSubjectCode}`);
                
                const handoutsBase = path.join(__dirname, '..', 'handouts');
                let handoutsDir = null;
                try {
                    const folders = fs.readdirSync(handoutsBase).filter(name => fs.statSync(path.join(handoutsBase, name)).isDirectory());
                    const match = folders.find(f => f.toLowerCase() === `vu-projects-${foundSubjectCode.toLowerCase()}-pdfs`);
                    if (match) handoutsDir = path.join(handoutsBase, match);
                } catch (err) {
                    handoutsDir = null;
                }

                if (handoutsDir && fs.existsSync(handoutsDir)) {
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