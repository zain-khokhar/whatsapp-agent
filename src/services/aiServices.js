
const { GoogleGenerativeAI } = require("@google/generative-ai");


if (!process.env.GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY environment variable set nahi hai.");

  process.exit(1); 
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const systemInstruction = "You are 'VU Helper,' an AI assistant in a WhatsApp group for Virtual University of Pakistan students. Your role is to help students with coding problems and provide accurate, helpful, and concise answers about VU courses, assignments, exams, and academic queries. Always respond in the SAME LANGUAGE as the student's question (English, Urdu, or Roman Urdu).";

const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash",
  systemInstruction: systemInstruction,
  generationConfig: {
    maxOutputTokens: 6000,
    temperature: 0.2,
    topP: 0.9,
  }
});

/**
 * Get AI response from Google Gemini Pro
 * @param {string} userMessage - User's message
 * @returns {Promise<string>} AI response
 */
async function getAIResponse(userMessage) {
  try {
    const result = await model.generateContent(userMessage);
    const response = await result.response;
    const text = response.text();

    return text.trim() || 'Sorry, I could not generate a response.';

  } catch (error) {
    console.error(' AI Service Error (Gemini):', error.message);
    
    if (error.message && (error.message.includes('429') || error.message.toUpperCase().includes('RATE_LIMIT'))) {
      return 'I am currently receiving too many requests. Please try again in a moment.';
    }
    
    if (error.message) {
      return `Sorry, I encountered an API error. Please try again.`;
    }
    
    return 'Sorry, an unknown error occurred while processing your request.';
  }
}

module.exports = { getAIResponse };