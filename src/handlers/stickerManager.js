/**
 * Sticker Manager Module
 * Handles sticker detection, warnings, and user kicks
 */

const { readData, updateData } = require('../utils/storage');

// Constants
const MAX_WARNINGS = 3;
const USER_WARNINGS_FILE = 'user-warnings.json';

/**
 * Get current warning count for a user
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID
 * @returns {number} - Current warning count
 */
function getUserWarningCount(groupId, userId) {
    const warnings = readData(USER_WARNINGS_FILE, {});
    const key = `${groupId}:${userId}`;
    return warnings[key] || 0;
}

/**
 * Increment warning count for a user
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID
 * @returns {number} - New warning count
 */
function incrementWarning(groupId, userId) {
    const warnings = updateData(USER_WARNINGS_FILE, (data) => {
        const key = `${groupId}:${userId}`;
        data[key] = (data[key] || 0) + 1;
        return data;
    }, {});
    
    const key = `${groupId}:${userId}`;
    return warnings[key];
}

/**
 * Reset warnings for a user (after kick)
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID
 */
function resetWarnings(groupId, userId) {
    updateData(USER_WARNINGS_FILE, (data) => {
        const key = `${groupId}:${userId}`;
        delete data[key];
        return data;
    }, {});
}

/**
 * Handle sticker message - warn user and kick if needed
 * @param {Object} msg - WhatsApp message object
 * @param {Object} chat - WhatsApp chat object
 * @returns {Promise<boolean>} - True if handled successfully
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
        
        // Increment warning count
        const warningCount = incrementWarning(groupId, userId);
        
        console.log(`[Sticker Manager] Sticker deleted. User ${userId} warning ${warningCount}/${MAX_WARNINGS}`);
        
        // Check if user should be kicked
        if (warningCount >= MAX_WARNINGS) {
            await chat.removeParticipants([userId]);
            console.log(`[Sticker Manager] User ${userId} kicked after ${MAX_WARNINGS} warnings`);
            
            // Reset warnings after kick
            resetWarnings(groupId, userId);
        }
        
        return true;
    } catch (error) {
        console.error('[Sticker Manager] Error handling sticker:', error.message);
        return false;
    }
}

module.exports = {
    handleSticker,
    getUserWarningCount,
    incrementWarning,
    resetWarnings
};
