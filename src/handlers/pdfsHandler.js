const fs = require('fs');
const path = require('path');
const { MessageMedia } = require('whatsapp-web.js');
const { readData, updateData } = require('../utils/storage');

// Managed group ID from environment variable
const MANAGED_GROUP_ID = process.env.MANAGED_GROUP_ID || '120363402134871151@g.us';

const subjectFolderNames = [
    "ACC", "BIF", "BIO", "BIT", "BNK", "BT", "CHE", "CS", "ECO", "EDU", "ENG", "ETH", "FIN",
    "GSC", "HRM", "ISL", "IT", "MTH", "MCD", "MCM", "MGMT", "MGT", "MKT", "PAD", "PAK",
    "PHY", "PSC", "SOC", "STA", "URD", "ZOO"
];
const subjectCodes = new Set(subjectFolderNames.map(s => s.toLowerCase()));

// Constants
const HANDOUT_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
const MAX_WARNINGS = 3;
const HANDOUT_TIMING_FILE = 'handout-timing.json';
const USER_WARNINGS_FILE = 'user-warnings.json';

/**
 * Check if user is admin in the group
 */
async function isUserAdmin(chat, userId) {
    try {
        if (!chat.isGroup) return false;
        const participants = chat.participants || [];
        const participant = participants.find(p => p.id._serialized === userId);
        
        if (!participant) {
            console.log(`[PDF Handler] User ${userId} not found in participants`);
            return false;
        }
        
        const isAdmin = participant.isAdmin || participant.isSuperAdmin;
        console.log(`[PDF Handler] User ${userId} admin status: ${isAdmin}`);
        return isAdmin;
    } catch (error) {
        console.error('[PDF Handler] Error checking admin status:', error.message);
        return false;
    }
}

/**
 * Check if handout can be sent (cooldown check)
 */
function canSendHandout(groupId, courseCode) {
    const timingData = readData(HANDOUT_TIMING_FILE, {});
    const key = `${groupId}:${courseCode}`;
    const lastSent = timingData[key];
    
    if (!lastSent) return true;
    
    const now = Date.now();
    const timeSinceLastSend = now - lastSent;
    
    return timeSinceLastSend >= HANDOUT_COOLDOWN_MS;
}

/**
 * Record handout send time
 */
function recordHandoutSend(groupId, courseCode) {
    updateData(HANDOUT_TIMING_FILE, (data) => {
        const key = `${groupId}:${courseCode}`;
        data[key] = Date.now();
        return data;
    }, {});
}

/**
 * Get time remaining for cooldown
 */
function getCooldownTimeRemaining(groupId, courseCode) {
    const timingData = readData(HANDOUT_TIMING_FILE, {});
    const key = `${groupId}:${courseCode}`;
    const lastSent = timingData[key];
    
    if (!lastSent) return 0;
    
    const now = Date.now();
    const elapsed = now - lastSent;
    const remaining = HANDOUT_COOLDOWN_MS - elapsed;
    
    return remaining > 0 ? remaining : 0;
}

/**
 * Format milliseconds to readable time
 */
function formatTime(ms) {
    const minutes = Math.ceil(ms / (60 * 1000));
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours !== 1 ? 's' : ''}`;
}

/**
 * Handle sticker message
 */
async function handleSticker(msg, chat) {
    try {
        const userId = msg.author || msg.from;
        const groupId = msg.from;
        
        // Send warning mentioning the user with @ tag
        await chat.sendMessage('@' + userId.split('@')[0] + ' Stickers are not allowed in the group', {
            mentions: [userId]
        });
        
        // Delete the sticker
        await msg.delete(true);
        
        // Update warnings
        const warnings = updateData(USER_WARNINGS_FILE, (data) => {
            const key = `${groupId}:${userId}`;
            data[key] = (data[key] || 0) + 1;
            return data;
        }, {});
        
        const key = `${groupId}:${userId}`;
        const warningCount = warnings[key];
        
        console.log(`[PDF Handler] Sticker deleted. User ${userId} warning ${warningCount}/${MAX_WARNINGS}`);
        
        if (warningCount >= MAX_WARNINGS) {
            // Kick user
            await chat.removeParticipants([userId]);
            console.log(`[PDF Handler] User ${userId} kicked after ${MAX_WARNINGS} warnings`);
            
            // Reset warnings
            updateData(USER_WARNINGS_FILE, (data) => {
                delete data[key];
                return data;
            }, {});
        }
        
        return true;
    } catch (error) {
        console.error('[PDF Handler] Error handling sticker:', error.message);
        return false;
    }
}

/**
 * Handle admin commands
 */
async function handleAdminCommand(msg, chat, command) {
    try {
        const userId = msg.author || msg.from;
        console.log(`[PDF Handler] Admin command received: ${command} from user: ${userId}`);
        
        const isAdmin = await isUserAdmin(chat, userId);
        
        if (!isAdmin) {
            console.log(`[PDF Handler] User ${userId} is not admin, ignoring command`);
            // Silently ignore non-admin commands
            return true;
        }
        
        const groupId = msg.from;
        
        // !all - Mention all members
        if (command.startsWith('!all')) {
            const message = msg.body.substring(4).trim();
            if (!message) {
                // Silently ignore if no message provided
                return true;
            }
            
            const participants = chat.participants || [];
            const mentions = participants.map(p => p.id._serialized);
            
            await chat.sendMessage(`📢 *IMPORTANT NOTIFICATION*\n\n${message}`, {
                mentions: mentions
            });
            
            console.log(`[PDF Handler] Important notification sent to ${mentions.length} members`);
            return true;
        }
        
        // !kick - Kick user
        if (command.startsWith('!kick')) {
            const match = msg.body.match(/!kick\s+"([^"]+)"/);
            if (!match) {
                // Silently ignore invalid format
                return true;
            }
            
            const targetName = match[1].toLowerCase();
            const participants = chat.participants || [];
            
            // Find user by name
            const targetParticipant = participants.find(p => {
                const contact = p.id._serialized;
                // Try to match by notify name or contact name
                return (p.notify && p.notify.toLowerCase().includes(targetName)) ||
                       contact.toLowerCase().includes(targetName);
            });
            
            if (!targetParticipant) {
                // Silently ignore if user not found
                return true;
            }
            
            // Don't kick admins
            if (targetParticipant.isAdmin) {
                // Silently ignore attempt to kick admin
                return true;
            }
            
            await chat.removeParticipants([targetParticipant.id._serialized]);
            console.log(`[PDF Handler] User ${targetParticipant.id._serialized} kicked by admin`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('[PDF Handler] Error handling admin command:', error.message);
        return true;
    }
}

/**
 * Main message handler
 */
async function handleMessage(msg) {
    // Only handle messages from the managed group
    if (msg.from !== MANAGED_GROUP_ID) return false;
    
    try {
        const chat = await msg.getChat();
        const userId = msg.author || msg.from;
        const groupId = msg.from;
        
        // Handle stickers first
        if (msg.hasMedia && msg.type === 'sticker') {
            return await handleSticker(msg, chat);
        }
        
        // Check admin commands
        const lowerBody = msg.body.toLowerCase();
        if (lowerBody.startsWith('!all') || lowerBody.startsWith('!kick')) {
            return await handleAdminCommand(msg, chat, msg.body);
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
            // Check cooldown (silently block if within cooldown period)
            if (!canSendHandout(groupId, foundCourseCode)) {
                const remaining = getCooldownTimeRemaining(groupId, foundCourseCode);
                const timeStr = formatTime(remaining);
                console.log(`[PDF Handler] Handout ${foundCourseCode} blocked due to cooldown (${timeStr} remaining)`);
                return true; // Silently ignore the request
            }
            
            // Find and send handout
            let subjectFolder = foundCourseCode.match(/^[a-z]+/i);
            subjectFolder = subjectFolder ? subjectFolder[0].toUpperCase() : foundCourseCode.substring(0, 3).toUpperCase();
            
            const handoutsBase = path.join(__dirname, '..', 'handouts');
            let handoutsDir = null;
            
            try {
                const folders = fs.readdirSync(handoutsBase).filter(name => 
                    fs.statSync(path.join(handoutsBase, name)).isDirectory()
                );
                const match = folders.find(f => 
                    f.toLowerCase() === `vu-projects-${subjectFolder.toLowerCase()}-pdfs`
                );
                if (match) handoutsDir = path.join(handoutsBase, match);
            } catch (err) {
                handoutsDir = null;
            }
            
            if (handoutsDir && fs.existsSync(handoutsDir)) {
                const files = fs.readdirSync(handoutsDir);
                const matchingFile = files.find(file => 
                    file.toLowerCase().endsWith('.pdf') && 
                    file.toLowerCase().replace(/[^a-z0-9]/g, '').startsWith(foundCourseCode)
                );
                
                if (matchingFile) {
                    const filePath = path.join(handoutsDir, matchingFile);
                    const media = MessageMedia.fromFilePath(filePath);
                    await msg.reply(media, undefined, { caption: 'Handout sent by AI Agent' });
                    
                    // Record the send time
                    recordHandoutSend(groupId, foundCourseCode);
                    console.log(`[PDF Handler] Handout ${foundCourseCode} sent successfully`);
                    return true;
                }
            }
        }
        
        return false;
        
    } catch (error) {
        console.error('[PDF Handler] Error handling message:', error.message);
        return false;
    }
}

module.exports = { handleMessage };
