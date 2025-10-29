/**
 * messageReviewer: Gatekeeper for FYP/paid service detection in WhatsApp groups
 * Monitors all group messages, detects FYP/paid service intent, and sends a DM to the user from the required sender ID.
 */
const REQUIRED_SENDER_ID = '923197542768@c.us';
const { isStudentFYPRequest } = require('./services/aiReviewerServices');



/**
 * Main reviewer function
 * @param {Object} msg - WhatsApp message object
 * @param {Object} client - WhatsApp client instance
 */
async function messageReviewer(msg, client) {
  try {
    // Only monitor group messages, or private messages from the required sender ID
    const isTargetPrivate = (!msg.isGroupMsg && msg.from === REQUIRED_SENDER_ID);
    if (!msg.fromMe && (msg.isGroupMsg || isTargetPrivate)) {
      // Use Gemini AI to decide if this is a student FYP/project help/buy request
      const shouldSend = await isStudentFYPRequest(msg.body);
      if (shouldSend) {
        const contact = await msg.getContact();
        const userId = contact.id._serialized;
        // Compose the DM message
        const dm = `I am a professional developer. I’ve already completed many projects, and the price range of my projects is between 15k and 20k, depending on the project requirements.`;
        // Send DM from the required sender ID
        await client.sendMessage(userId, dm, { from: REQUIRED_SENDER_ID });
        console.log(`[messageReviewer] Sent DM to ${userId} for FYP/paid service detection.`);
      }
    }
  } catch (err) {
    console.error('[messageReviewer] Error:', err.message);
  }
}

module.exports = { messageReviewer };
