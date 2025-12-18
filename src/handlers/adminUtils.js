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
        
        // Check if bot itself is admin (required for kicking)
        const botId = chat.client.info.wid._serialized;
        console.log(`[Admin Utils] Bot ID: ${botId}`);
        const isBotAdmin = await isUserAdmin(chat, botId);
        console.log(`[Admin Utils] Bot admin status: ${isBotAdmin}`);
        if (!isBotAdmin) {
            console.log(`[Admin Utils] Bot is not admin in this group, cannot execute admin commands`);
            return true; // Silently ignore - bot needs to be admin
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
    // Parse username or number from command - support both quoted and unquoted names
    let targetName;
    let match = msg.body.match(/!kick\s+"([^"]+)"/);
    if (match) {
        targetName = match[1];
    } else {
        match = msg.body.match(/!kick\s+(.+)/);
        if (match) {
            targetName = match[1].trim();
        }
    }
    if (!targetName) {
        console.log(`[Admin Utils] No target name found in kick command: ${msg.body}`);
        return true;
    }
    console.log(`[Admin Utils] Attempting to kick user: "${targetName}"`);
    const participants = chat.participants || [];
    console.log(`[Admin Utils] Group has ${participants.length} participants`);

    // If the target looks like a number (e.g. 923001234567), try to match by number
    const numberMatch = targetName.match(/\d{10,}/);
    if (numberMatch) {
        const number = numberMatch[0];
        const exactId = number + '@c.us';
        const targetParticipant = participants.find(p => p.id._serialized === exactId);
        if (targetParticipant) {
            if (targetParticipant.isAdmin || targetParticipant.isSuperAdmin) {
                console.log(`[Admin Utils] Cannot kick admin user: ${targetParticipant.notify}`);
                return true;
            }
            try {
                console.log(`[Admin Utils] Attempting to kick user ${targetParticipant.id._serialized}`);
                await chat.removeParticipants([targetParticipant.id._serialized]);
                console.log(`[Admin Utils] Successfully kicked user ${targetParticipant.id._serialized}`);
                return true;
            } catch (error) {
                console.error(`[Admin Utils] Failed to kick user ${targetParticipant.id._serialized}:`, error.message);
                return true;
            }
        } else {
            console.log(`[Admin Utils] No participant found with number: ${number}`);
            return true;
        }
    }

    // Otherwise, match by name (notify/display name)
    const targetNameLower = targetName.toLowerCase();
    const matches = participants.filter(p => {
        const notifyName = (p.notify || '').toLowerCase();
        return notifyName.includes(targetNameLower);
    });
    if (matches.length === 0) {
        console.log(`[Admin Utils] No participant found with name: ${targetName}`);
        return true;
    }
    if (matches.length > 1) {
        let names = matches.map(p => `${p.notify} (${p.id._serialized})`).join(', ');
        await chat.sendMessage(`Multiple users match "${targetName}":\n${names}\nPlease use the number to kick (e.g. !kick 923001234567)`);
        return true;
    }
    const targetParticipant = matches[0];
    if (targetParticipant.isAdmin || targetParticipant.isSuperAdmin) {
        console.log(`[Admin Utils] Cannot kick admin user: ${targetParticipant.notify}`);
        return true;
    }
    try {
        console.log(`[Admin Utils] Attempting to kick user ${targetParticipant.id._serialized}`);
        await chat.removeParticipants([targetParticipant.id._serialized]);
        console.log(`[Admin Utils] Successfully kicked user ${targetParticipant.id._serialized}`);
        return true;
    } catch (error) {
        console.error(`[Admin Utils] Failed to kick user ${targetParticipant.id._serialized}:`, error.message);
        return true;
    }
}

module.exports = {
    isUserAdmin,
    handleAdminCommand
};
