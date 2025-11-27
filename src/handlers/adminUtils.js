/**
 * Admin Utilities Module
 * Handles admin permission checking and admin commands
 */

/**
 * Check if user is admin in the group
 * @param {Object} chat - WhatsApp chat object
 * @param {string} userId - User ID to check
 * @returns {Promise<boolean>} - True if user is admin
 */
async function isUserAdmin(chat, userId) {
    try {
        if (!chat.isGroup) return false;
        
        const participants = chat.participants || [];
        const participant = participants.find(p => p.id._serialized === userId);
        
        if (!participant) {
            console.log(`[Admin Utils] User ${userId} not found in participants`);
            return false;
        }
        
        const isAdmin = participant.isAdmin || participant.isSuperAdmin;
        console.log(`[Admin Utils] User ${userId} admin status: ${isAdmin}`);
        return isAdmin;
    } catch (error) {
        console.error('[Admin Utils] Error checking admin status:', error.message);
        return false;
    }
}

/**
 * Handle admin commands (!all, !kick)
 * @param {Object} msg - WhatsApp message object
 * @param {Object} chat - WhatsApp chat object
 * @returns {Promise<boolean>} - True if command was handled
 */
async function handleAdminCommand(msg, chat) {
    try {
        const userId = msg.author || msg.from;
        const command = msg.body.toLowerCase();
        
        console.log(`[Admin Utils] Admin command received: ${command} from user: ${userId}`);
        
        // Early validation - check if user is admin
        const isAdmin = await isUserAdmin(chat, userId);
        if (!isAdmin) {
            console.log(`[Admin Utils] User ${userId} is not admin, ignoring command`);
            return true; // Silently ignore non-admin commands
        }
        
        // Handle !all command - Mention all members
        if (command.startsWith('!all')) {
            return await handleAllCommand(msg, chat);
        }
        
        // Handle !kick command - Kick user
        if (command.startsWith('!kick')) {
            return await handleKickCommand(msg, chat);
        }
        
        return false;
    } catch (error) {
        console.error('[Admin Utils] Error handling admin command:', error.message);
        return true; // Return true to prevent further processing
    }
}

/**
 * Handle !all command - mention all group members
 * @param {Object} msg - WhatsApp message object
 * @param {Object} chat - WhatsApp chat object
 * @returns {Promise<boolean>} - True if handled
 */
async function handleAllCommand(msg, chat) {
    const message = msg.body.substring(4).trim();
    
    // Silently ignore if no message provided
    if (!message) {
        return true;
    }
    
    const participants = chat.participants || [];
    const mentions = participants.map(p => p.id._serialized);
    
    await chat.sendMessage(`📢 *IMPORTANT NOTIFICATION*\n\n${message}`, {
        mentions: mentions
    });
    
    console.log(`[Admin Utils] Important notification sent to ${mentions.length} members`);
    return true;
}

/**
 * Handle !kick command - remove user from group
 * @param {Object} msg - WhatsApp message object
 * @param {Object} chat - WhatsApp chat object
 * @returns {Promise<boolean>} - True if handled
 */
async function handleKickCommand(msg, chat) {
    // Parse username from command
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
    
    // Early exits for invalid cases
    if (!targetParticipant) {
        // Silently ignore if user not found
        return true;
    }
    
    if (targetParticipant.isAdmin || targetParticipant.isSuperAdmin) {
        // Silently ignore attempt to kick admin
        return true;
    }
    
    // Remove the participant
    await chat.removeParticipants([targetParticipant.id._serialized]);
    console.log(`[Admin Utils] User ${targetParticipant.id._serialized} kicked by admin`);
    return true;
}

module.exports = {
    isUserAdmin,
    handleAdminCommand
};
