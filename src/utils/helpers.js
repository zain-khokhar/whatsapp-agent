/**
 * Validate if message is a formal question
 * @param {Object} msg - WhatsApp message object
 * @returns {boolean} True if valid question
 */
function isValidQuestion(msg) {
  // Check if message type is text
  if (msg.type !== 'chat') {
    return false;
  }

  // Get message body
  const messageBody = msg.body?.trim();

  // Check if message is empty or undefined
  if (!messageBody || messageBody.length === 0) {
    return false;
  }

  // Check minimum length (at least 3 characters)
  if (messageBody.length < 3) {
    return false;
  }

  // Check if message contains only emojis or special characters
  const emojiRegex = /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]+$/u;
  if (emojiRegex.test(messageBody)) {
    return false;
  }

  // Check if message contains at least one letter (to filter out only numbers/symbols)
  const hasLetters = /[a-zA-Z\u0600-\u06FF]/.test(messageBody);
  if (!hasLetters) {
    return false;
  }

  return true;
}

module.exports = { isValidQuestion };
