const fs = require('fs');
const path = require('path');
const { MessageMedia } = require('whatsapp-web.js');

const subjectFolderNames = [
    "ACC", "BIF", "BIO", "BIT", "BNK", "BT", "CHE", "CS", "ECO", "EDU", "ENG", "ETH", "FIN",
    "GSC", "HRM", "ISL", "IT", "MTH", "MCD", "MCM", "MGMT", "MGT", "MKT", "PAD", "PAK",
    "PHY", "PSC", "SOC", "STA", "URD", "ZOO"
];
const subjectCodes = new Set(subjectFolderNames.map(s => s.toLowerCase()));

const HISTORY_DIR = path.join(__dirname, '..', 'data');
const HISTORY_FILE = path.join(HISTORY_DIR, 'handoutHistory.json');
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


async function handleMessage(msg) {

    try {
        const chatId = msg.from;
        const chat = await msg.getChat();
        
        const contactName = msg._data?.notifyName || chat.name || chatId;
        
        const lowerBody = msg.body.toLowerCase();
        const normalizedBody = lowerBody.replace(/\s+/g, ''); 

        const courseCodes = require('../utils/courseCode');

        let foundCourseCode = null;
        for (const code of courseCodes) {
            if (normalizedBody.includes(code)) {
                foundCourseCode = code;
                break;
            }
        }

        if (foundCourseCode) {
            
            console.log(`[PDF Handler] Handout request from: ${contactName}`);
            console.log(`[PDF Handler] Chat: ${chat.name || 'Private'}`);
            console.log(`[PDF Handler] Message: ${msg.body}`);
            console.log(`[PDF Handler] Course code detected: ${foundCourseCode}`);
            
            let subjectFolder = foundCourseCode.match(/^[a-z]+/i);
            subjectFolder = subjectFolder ? subjectFolder[0].toUpperCase() : foundCourseCode.substring(0, 3).toUpperCase();

            const handoutsBase = path.join(__dirname, '..', 'handouts');
            let handoutsDir = null;
            try {
                const folders = fs.readdirSync(handoutsBase).filter(name => fs.statSync(path.join(handoutsBase, name)).isDirectory());
                const match = folders.find(f => f.toLowerCase() === `vu-projects-${subjectFolder.toLowerCase()}-pdfs`);
                if (match) handoutsDir = path.join(handoutsBase, match);
            } catch (err) {
                handoutsDir = null;
            }
            
            if (handoutsDir && fs.existsSync(handoutsDir)) {
                const files = fs.readdirSync(handoutsDir);
                
                const matchingFile = files.find(file => {
                    if (file.toLowerCase().endsWith('.pdf')) {
                        const fileNameLower = file.toLowerCase();
                        const normalizedFileName = fileNameLower.replace(/[^a-z0-9]/g, '');
                        
                        return normalizedFileName.startsWith(foundCourseCode);
                    }
                    return false;
                });

                if (matchingFile) {
                    const chatKey = msg.from; 
                    const fileKey = matchingFile; 
                    const now = Date.now();
                    const ONE_HOUR_MS = 60 * 60 * 1000;

                    if (!sendHistory[chatKey]) sendHistory[chatKey] = {};
                    const lastSent = sendHistory[chatKey][fileKey] || 0;

                    if (lastSent && (now - lastSent) < ONE_HOUR_MS) {
                        console.log(`[PDF Handler] Skipping send of ${matchingFile} to ${chatKey} — sent ${Math.round((now - lastSent) / 60000)} minutes ago.`);
                        return true;
                    }

                    const filePath = path.join(handoutsDir, matchingFile);
                    const media = MessageMedia.fromFilePath(filePath);
                    console.log(`[PDF Handler] Sending PDF: ${matchingFile} for code: ${foundCourseCode} to ${chatKey}`);
                    await msg.reply(media, undefined, { caption: 'Handout sent by AI Agent' });

                    sendHistory[chatKey][fileKey] = now;
                    saveHistory();

                    return true; 
                }
            }
        } 
        else {
            const requestKeywords = ['handout', 'pdf', 'notes', 'material', 'project', 'book', 'solution', 'past paper', 'assignment', 'quiz', 'midterm', 'final'];
            const seemsLikeRequest = requestKeywords.some(keyword => lowerBody.includes(keyword));
            
            const words = lowerBody.split(/\W+/);
            let foundSubjectCode = null;
            
            if (seemsLikeRequest) {
                for (const word of words) {
                    if (subjectCodes.has(word)) {
                        foundSubjectCode = word.toUpperCase(); 
                        break;
                    }
                }
            }

            if (foundSubjectCode) {
                
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
                        return true; 
                    } else {
                        await msg.reply(`I found the *${foundSubjectCode}* folder, but it seems to be empty. 🤷‍♂️`);
                        return true; 
                    }
                }
            }
        }

        if (msg.body === '!ping') {
            await msg.reply('Pong! Bot is active and running.');
            return true; 
        }

        return false; 

    } catch (error) {
        console.error('[PDF Handler] Error handling message:', error);
        return false; 
    }
}

module.exports = { handleMessage };