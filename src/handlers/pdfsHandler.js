const fs = require('fs');
const path = require('path');
const { MessageMedia } = require('whatsapp-web.js');
const { handleAdminCommand } = require('./adminUtils');
const { handleSticker } = require('./stickerManager');

const subjectFolderNames = [
    "ACC", "BIF", "BIO", "BIT", "BNK", "BT", "CHE", "CS", "ECO", "EDU", "ENG", "ETH", "FIN",
    "GSC", "HRM", "ISL", "IT", "MTH", "MCD", "MCM", "MGMT", "MGT", "MKT", "PAD", "PAK",
    "PHY", "PSC", "SOC", "STA", "URD", "ZOO"
];
const subjectCodes = new Set(subjectFolderNames.map(s => s.toLowerCase()));

// Admin-enabled groups (where sticker warnings and admin commands work)
const ADMIN_GROUPS = [
    '120363422289030389@g.us',
    '120363420568360131@g.us',
    '120363402134871151@g.us'
];

// Simple 1-hour cooldown tracker: { "groupId:courseCode": timestamp }
const handoutCooldowns = new Map();
const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Check if group has admin features enabled
 * @param {string} groupId - Group ID to check
 * @returns {boolean} - True if admin features are enabled
 */
function isAdminEnabledGroup(groupId) {
    return ADMIN_GROUPS.includes(groupId);
}

async function handleMessage(msg) {
    try {
        const chatId = msg.from;
        const chat = await msg.getChat();
        const contactName = msg._data?.notifyName || chat.name || chatId;

        // Handle stickers only in admin-enabled groups
        if (msg.hasMedia && msg.type === 'sticker') {
            if (isAdminEnabledGroup(chatId)) {
                return await handleSticker(msg, chat);
            } else {
                console.log('[PDF Handler] Sticker in non-admin group - ignoring');
                return false;
            }
        }

        // Check for admin commands only in admin-enabled groups
        const lowerBody = msg.body.toLowerCase();
        if (lowerBody.startsWith('!all') || lowerBody.startsWith('!kick')) {
            if (isAdminEnabledGroup(chatId)) {
                return await handleAdminCommand(msg, chat);
            } else {
                console.log('[PDF Handler] Admin command in non-admin group - ignoring');
                return false;
            }
        }

        // Handle handout requests
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
            // Check 1-hour cooldown for this group + handout
            const cooldownKey = `${chatId}:${foundCourseCode}`;
            const lastSent = handoutCooldowns.get(cooldownKey);
            const now = Date.now();
            
            if (lastSent && (now - lastSent) < ONE_HOUR) {
                console.log(`[PDF Handler] Cooldown active for ${foundCourseCode} in group ${chatId}`);
                return true; // Silently ignore
            }

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
                    const filePath = path.join(handoutsDir, matchingFile);
                    const media = MessageMedia.fromFilePath(filePath);
                    await msg.reply(media, undefined, { caption: 'Handout sent by AI Agent' });
                    
                    // Record send time for 1-hour cooldown
                    handoutCooldowns.set(cooldownKey, now);
                    console.log(`[PDF Handler] Handout ${foundCourseCode} sent to group ${chatId}`);
                    return true;
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
