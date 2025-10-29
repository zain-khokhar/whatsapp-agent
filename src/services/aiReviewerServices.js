const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!process.env.GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY environment variable not set.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const reviewerInstruction = `You are the 'Message Reviewer' for a WhatsApp group. Your job is to analyze each message and decide if it is from a student seeking help with their Final Year Project (FYP), any VU project (including course codes like CS619), or looking to buy a paid project/service.

Instructions:
- Only respond 'TRUE' (no explanation) if the message is from a student who wants FYP/project help, guidance, or to buy a project/service (even if the request is indirect, polite, vague, or mentions course codes like CS619, CS619 project, etc.).
- Respond 'TRUE' for any message where the user is asking for paid projects, wants to buy, or is seeking help for any VU project or FYP.
- Respond 'FALSE' (no explanation) for all other cases, including if the message is from a seller, spam, or irrelevant.
- Do not explain your answer. Only reply with TRUE or FALSE.

Examples of messages that should get 'TRUE':
1. "Can someone help me with my FYP?"
2. "I need guidance for my final year project."
3. "How much does it cost to get a project made?"
4. "Anyone selling FYP solutions?"
5. "tell me something about the final project"
6. "I want to buy a project for VU."
7. "Can you make my FYP?"
8. "Looking for someone to do my project."
9. "I need paid projects of vu cs619"
10. "I want to buy a CS619 project."
11. "Looking for paid FYP for VU."
12. "Can someone make my CS619 project for me?"
13. "Paid help needed for final year project."
14. "Who can sell me a VU project?"

Examples of messages that should get 'FALSE':
1. "I am offering FYP services."
2. "Contact me for project help, paid only."
3. "Selling FYPs, DM me."
4. "Spam message or unrelated chat."
5. "I have completed many projects for students."
6. "Contact for best price on FYP."
7. "I am a professional developer."
8. "Any seller here?"
9. "I am selling CS619 projects."
10. "Contact me if you want to buy a project."
`;

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: reviewerInstruction,
  generationConfig: {
    maxOutputTokens: 10,
    temperature: 0.1,
    topP: 0.8,
  }
});

/**
 * Uses Gemini to review a message and decide if it is a student FYP/project help/buy request
 * @param {string} messageText
 * @returns {Promise<boolean>} TRUE if student request, FALSE otherwise
 */
async function isStudentFYPRequest(messageText) {
  try {
    const result = await model.generateContent(messageText);
    const response = await result.response;
    const text = response.text().trim().toUpperCase();
    if (text === 'TRUE') return true;
    return false;
  } catch (error) {
    console.error('[aiReviewerServices] AI error:', error.message);
    // Fail safe: do not trigger DM on error
    return false;
  }
}

module.exports = { isStudentFYPRequest };