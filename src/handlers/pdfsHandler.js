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
        // Support older formats where we stored a number; normalize to { sentAt: number, sentAtISO: string }
        const raw = fs.readFileSync(HISTORY_FILE, 'utf8') || '{}';
        const parsed = JSON.parse(raw);
        // Normalize each value to the new object form
        const normalize = (v) => {
            if (!v) return null;
            if (typeof v === 'number') {
                const sentAt = v;
                return { sentAt, sentAtISO: new Date(sentAt).toISOString(), sentAtLocal: new Date(sentAt).toLocaleString('en-US', { hour12: true }) };
            }
            if (typeof v === 'object' && v.sentAt) {
                return { sentAt: v.sentAt, sentAtISO: new Date(v.sentAt).toISOString(), sentAtLocal: new Date(v.sentAt).toLocaleString('en-US', { hour12: true }) };
            }
            return null;
        };

        sendHistory = {};
        for (const chatKey of Object.keys(parsed || {})) {
            sendHistory[chatKey] = {};
            const files = parsed[chatKey] || {};
            for (const fileKey of Object.keys(files)) {
                const normalized = normalize(files[fileKey]);
                if (normalized) sendHistory[chatKey][fileKey] = normalized;
            }
        }
    }
} catch (err) {
    console.warn('[PDF Handler] Could not load send history:', err && err.message);
    sendHistory = {};
}

function saveHistory() {
    try {
        // Write atomically by writing to a temp file then renaming
        const tmpFile = `${HISTORY_FILE}.tmp`;
        fs.writeFileSync(tmpFile, JSON.stringify(sendHistory, null, 2), 'utf8');
        fs.renameSync(tmpFile, HISTORY_FILE);
    } catch (err) {
        console.warn('[PDF Handler] Failed to save send history:', err && err.message);
    }
}

async function handleMessage(msg) {
    try {
        const lowerBody = msg.body.toLowerCase();
        const normalizedBody = lowerBody.replace(/\s+/g, ''); 

        const courseCodes = require('../utils/courseCode'); // your course codes list
        let foundCourseCode = null;

        for (const code of courseCodes) {
            if (normalizedBody.includes(code)) {
                foundCourseCode = code;
                break;
            }
        }

        // Agar valid course code milta hai
        if (foundCourseCode) {
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
                const matchingFile = files.find(file => file.toLowerCase().endsWith('.pdf') && 
                    file.toLowerCase().replace(/[^a-z0-9]/g, '').startsWith(foundCourseCode));

                if (matchingFile) {
                    const chatKey = msg.from;
                    const fileKey = matchingFile;
                    const now = Date.now();
                    const ONE_HOUR_MS = 60 * 60 * 1000;

                    if (!sendHistory[chatKey]) sendHistory[chatKey] = {};
                    let lastSent = 0;
                    if (sendHistory[chatKey] && sendHistory[chatKey][fileKey] && sendHistory[chatKey][fileKey].sentAt) {
                        lastSent = sendHistory[chatKey][fileKey].sentAt;
                    }

                    if (!lastSent || (now - lastSent) >= ONE_HOUR_MS) {
                        const filePath = path.join(handoutsDir, matchingFile);
                        const media = MessageMedia.fromFilePath(filePath);
                        await msg.reply(media, undefined, { caption: 'Handout sent by AI Agent' });

                        sendHistory[chatKey][fileKey] = {
                            sentAt: now,
                            sentAtISO: new Date(now).toISOString(),
                            sentAtLocal: new Date(now).toLocaleString('en-US', { hour12: true })
                        };
                        saveHistory();
                    }
                    return true;
                }
            }
        }

        // Agar course code match nahi hua, koi reply nahi
        return false;

    } catch (error) {
        console.error('[PDF Handler] Error handling message:', error);
        return false;
    }
}

// --- Automatic scheduler ---
// This scheduler will periodically read the persisted history and send files to chats that are due for a resend.
const ONE_HOUR_MS = 60 * 60 * 1000;
let scheduler = {
    intervalId: null,
    running: false
};

async function sendDueHandouts(client) {
    try {
        const now = Date.now();
        for (const chatKey of Object.keys(sendHistory)) {
            const files = sendHistory[chatKey] || {};
            for (const fileKey of Object.keys(files)) {
                const entry = files[fileKey];
                const lastSent = entry && entry.sentAt ? entry.sentAt : 0;
                if (!lastSent) continue;
                if ((now - lastSent) >= ONE_HOUR_MS) {
                    // Attempt to locate the file to send. fileKey refers to filename in folder.
                    const parts = fileKey.split(path.sep).slice(-1);
                    const filename = parts[0] || fileKey;
                    // Find matching folder under handouts base
                    const handoutsBase = path.join(__dirname, '..', 'handouts');
                    try {
                        const folders = fs.readdirSync(handoutsBase).filter(name => fs.statSync(path.join(handoutsBase, name)).isDirectory());
                        // Try to find the folder that contains the file
                        let resolvedPath = null;
                        for (const folder of folders) {
                            const possible = path.join(handoutsBase, folder, filename);
                            if (fs.existsSync(possible)) {
                                resolvedPath = possible;
                                break;
                            }
                        }

                        if (!resolvedPath) {
                            // could not find file, remove from history to avoid repeated failures
                            console.warn(`[PDF Handler] Scheduled send failed: file ${filename} not found for chat ${chatKey}. Removing from history.`);
                            delete sendHistory[chatKey][fileKey];
                            saveHistory();
                            continue;
                        }

                        // Create MessageMedia from file
                        const media = MessageMedia.fromFilePath(resolvedPath);
                        // Send as reply to the chat
                        try {
                            // client.sendMessage returns a promise
                            await client.sendMessage(chatKey, media, { caption: 'Hourly handout sent by AI Agent' });
                            const sentTime = Date.now();
                            sendHistory[chatKey][fileKey] = { sentAt: sentTime, sentAtISO: new Date(sentTime).toISOString(), sentAtLocal: new Date(sentTime).toLocaleString('en-US', { hour12: true }) };
                            saveHistory();
                            console.log(`[PDF Handler] Sent scheduled handout ${filename} to ${chatKey}`);
                        } catch (err) {
                            console.error('[PDF Handler] Failed to send scheduled handout:', err && err.message);
                        }
                    } catch (err) {
                        console.error('[PDF Handler] Error checking handouts folder for scheduled send:', err && err.message);
                    }
                }
            }
        }
    } catch (err) {
        console.error('[PDF Handler] Error in scheduled send job:', err && err.message);
    }
}

function initAutoSend(client, opts = {}) {
    const intervalMs = opts.intervalMs || 60 * 1000; // default: check every 1 minute
    if (scheduler.running) return scheduler;
    scheduler.running = true;
    scheduler.intervalId = setInterval(() => {
        // best-effort: don't block interval if client not ready
        if (!client || client.info === undefined) return;
        sendDueHandouts(client).catch(err => console.error('[PDF Handler] Scheduled job error:', err && err.message));
    }, intervalMs);
    console.log('[PDF Handler] Auto-send scheduler initialized. Running every', intervalMs, 'ms');
    return scheduler;
}

module.exports = { handleMessage, initAutoSend };
