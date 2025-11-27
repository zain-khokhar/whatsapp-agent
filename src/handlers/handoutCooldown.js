/**
 * Handout Cooldown Module
 * Manages rate limiting for handout requests
 */

const { readData, updateData } = require('../utils/storage');

// Constants
const HANDOUT_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
const HANDOUT_TIMING_FILE = 'handout-timing.json';

/**
 * Check if handout can be sent (cooldown check)
 * @param {string} groupId - Group ID
 * @param {string} courseCode - Course code
 * @returns {boolean} - True if cooldown has expired
 */
function canSendHandout(groupId, courseCode) {
    const timingData = readData(HANDOUT_TIMING_FILE, {});
    const key = `${groupId}:${courseCode}`;
    const lastSent = timingData[key];
    
    // No previous send - allow
    if (!lastSent) return true;
    
    const now = Date.now();
    const timeSinceLastSend = now - lastSent;
    
    return timeSinceLastSend >= HANDOUT_COOLDOWN_MS;
}

/**
 * Record handout send time
 * @param {string} groupId - Group ID
 * @param {string} courseCode - Course code
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
 * @param {string} groupId - Group ID
 * @param {string} courseCode - Course code
 * @returns {number} - Milliseconds remaining (0 if expired)
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
 * @param {number} ms - Milliseconds
 * @returns {string} - Formatted time string
 */
function formatTime(ms) {
    const minutes = Math.ceil(ms / (60 * 1000));
    
    if (minutes < 60) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    return mins > 0 
        ? `${hours}h ${mins}m` 
        : `${hours} hour${hours !== 1 ? 's' : ''}`;
}

module.exports = {
    canSendHandout,
    recordHandoutSend,
    getCooldownTimeRemaining,
    formatTime
};
