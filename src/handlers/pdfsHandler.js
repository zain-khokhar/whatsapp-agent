/**
 * PDF Handler Module (Refactored)
 * Main orchestrator for WhatsApp message handling
 * Delegates to specialized modules for specific functionality
 */

const { MessageMedia } = require('whatsapp-web.js');
const { handleAdminCommand } = require('./adminUtils');
const { handleSticker } = require('./stickerManager');
const { canSendHandout, recordHandoutSend, getCooldownTimeRemaining, formatTime } = require('./handoutCooldown');
const { findHandoutFile } = require('./handoutFinder');

// Managed group ID from environment variable
const MANAGED_GROUP_ID = process.env.MANAGED_GROUP_ID || '120363402134871151@g.us';

/**
 * Main message handler
 * Routes messages to appropriate handlers based on message type and content
 * @param {Object} msg - WhatsApp message object
 * @returns {Promise<boolean>} - True if message was handled
 */
async function handleMessage(msg) {
    // Early exit: Only handle messages from the managed group
    if (msg.from !== MANAGED_GROUP_ID) {
        return false;
    }
    
    try {
        // Fetch chat once and reuse
        const chat = await msg.getChat();
        
        // Handle stickers first (highest priority)
        if (msg.hasMedia && msg.type === 'sticker') {
            return await handleSticker(msg, chat);
        }
        
        // Check for admin commands
        const lowerBody = msg.body.toLowerCase();
        if (lowerBody.startsWith('!all') || lowerBody.startsWith('!kick')) {
            return await handleAdminCommand(msg, chat);
        }
        
        // Handle handout requests
        return await handleHandoutRequest(msg, chat, lowerBody);
        
    } catch (error) {
        console.error('[PDF Handler] Error handling message:', error.message);
        return false;
    }
}

/**
 * Handle handout request messages
 * @param {Object} msg - WhatsApp message object
 * @param {Object} chat - WhatsApp chat object
 * @param {string} lowerBody - Lowercase message body
 * @returns {Promise<boolean>} - True if handout was requested
 */
async function handleHandoutRequest(msg, chat, lowerBody) {
    // Find course code in message
    const courseCode = findCourseCodeInMessage(lowerBody);
    if (!courseCode) {
        return false; // No course code found
    }
    
    const groupId = msg.from;
    
    // Check cooldown (silently block if within cooldown period)
    if (!canSendHandout(groupId, courseCode)) {
        const remaining = getCooldownTimeRemaining(groupId, courseCode);
        const timeStr = formatTime(remaining);
        console.log(`[PDF Handler] Handout ${courseCode} blocked due to cooldown (${timeStr} remaining)`);
        return true; // Silently ignore the request
    }
    
    // Find handout file
    const filePath = findHandoutFile(courseCode);
    if (!filePath) {
        // No handout available - silently ignore
        return false;
    }
    
    // Send handout
    try {
        const media = MessageMedia.fromFilePath(filePath);
        await msg.reply(media, undefined, { caption: 'Handout sent by AI Agent' });
        
        // Record the send time
        recordHandoutSend(groupId, courseCode);
        console.log(`[PDF Handler] Handout ${courseCode} sent successfully`);
        return true;
    } catch (error) {
        console.error(`[PDF Handler] Error sending handout ${courseCode}:`, error.message);
        return false;
    }
}

/**
 * Find course code in message body
 * @param {string} lowerBody - Lowercase message body
 * @returns {string|null} - Course code or null if not found
 */
function findCourseCodeInMessage(lowerBody) {
    // Normalize message (remove whitespace)
    const normalizedBody = lowerBody.replace(/\s+/g, '');
    
    // Load course codes
    const courseCodes = require('../utils/courseCode');
    
    // Find first matching course code
    for (const code of courseCodes) {
        if (normalizedBody.includes(code)) {
            return code;
        }
    }
    
    return null;
}

module.exports = { handleMessage };
