/**
 * WhatsApp AI Service
 * Handles AI requests by forwarding messages to Copilot WhatsApp bot
 */

// Copilot WhatsApp contact
const COPILOT_CONTACT = '18772241042@c.us';
const AI_RESPONSE_TIMEOUT = 30000; // 30 seconds

// Track recent Copilot message IDs to prevent PDF handler from processing them
const recentCopilotMessages = new Set();

// System instruction for Copilot
const systemInstruction = "You are 'Zeno,' an AI assistant in a WhatsApp group for Virtual University of Pakistan students. Your role is to help students with coding problems and provide accurate, helpful, and concise answers about VU courses, assignments, exams, and academic queries. Do not include your name, 'Zeno', in your responses. Always respond in the SAME LANGUAGE as the student's question (English, Urdu, or Roman Urdu). When asked who created you or who your developer/maker is, always respond with 'DARK DEVELOPER 😈'.";

/**
 * Check if a message is from Copilot
 * @param {Object} msg - WhatsApp message object
 * @returns {boolean} - True if message is from Copilot
 */
function isMessageFromCopilot(msg) {
    return msg.from === COPILOT_CONTACT || recentCopilotMessages.has(msg.id._serialized);
}

/**
 * Get AI response from Copilot via WhatsApp
 * @param {Object} client - WhatsApp client instance
 * @param {string} userMessage - User's message
 * @returns {Promise<string>} AI response
 */
async function getAIResponse(client, userMessage) {
    try {
        console.log('[WhatsApp AI] Forwarding message to Copilot...');
        
        // Prepare full message with system prompt
        const fullMessage = `${systemInstruction}\n\nUser Question: ${userMessage}`;
        
        // Send message to Copilot
        await client.sendMessage(COPILOT_CONTACT, fullMessage);
        
        // Wait for response from Copilot
        const response = await waitForCopilotResponse(client);
        
        if (!response) {
            console.log('[WhatsApp AI] No response received from Copilot within timeout');
            return 'Sorry, I am taking too long to respond. Please try again.';
        }
        
        console.log('[WhatsApp AI] Response received from Copilot');
        return response.trim() || 'Sorry, I could not generate a response.';
        
    } catch (error) {
        console.error('[WhatsApp AI] Error getting AI response:', error.message);
        return 'Sorry, I encountered an error while processing your request. Please try again.';
    }
}

/**
 * Wait for response from Copilot
 * @param {Object} client - WhatsApp client instance
 * @returns {Promise<string|null>} Response text or null if timeout
 */
function waitForCopilotResponse(client) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        let responseReceived = false;
        
        // Create message listener
        const messageHandler = async (msg) => {
            try {
                // Check if message is from Copilot
                if (msg.from === COPILOT_CONTACT && !responseReceived) {
                    const elapsed = Date.now() - startTime;
                    
                    // Only accept messages within timeout window
                    if (elapsed <= AI_RESPONSE_TIMEOUT) {
                        responseReceived = true;
                        
                        // Track this message ID to prevent PDF handler from processing it
                        recentCopilotMessages.add(msg.id._serialized);
                        
                        // Clean up old message IDs after 5 minutes
                        setTimeout(() => {
                            recentCopilotMessages.delete(msg.id._serialized);
                        }, 5 * 60 * 1000);
                        
                        // Remove listener
                        client.removeListener('message', messageHandler);
                        
                        // Resolve with message body
                        resolve(msg.body);
                    }
                }
            } catch (error) {
                console.error('[WhatsApp AI] Error in message handler:', error.message);
            }
        };
        
        // Register listener
        client.on('message', messageHandler);
        
        // Set timeout
        setTimeout(() => {
            if (!responseReceived) {
                // Remove listener
                client.removeListener('message', messageHandler);
                resolve(null);
            }
        }, AI_RESPONSE_TIMEOUT);
    });
}

module.exports = { getAIResponse, isMessageFromCopilot };
