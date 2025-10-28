const Perplexity = require('@perplexity-ai/perplexity_ai');

const client = new Perplexity({
  apiKey: process.env.COMET_API_KEY,
});

/**
 * Get AI response from Perplexity API
 * @param {string} userMessage - User's message
 * @returns {Promise<string>} AI response
 */
async function getAIResponse(userMessage) {
  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [
        {
          role: 'system',
          content: "You are 'VU Helper,' an AI assistant for Virtual University of Pakistan students. Provide accurate, helpful, and concise answers about courses, assignments, exams, and academic queries. Always respond in the SAME LANGUAGE as the student's question (English, Urdu, or Roman Urdu)."
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      max_tokens: 2000,
      temperature: 0.2,
      top_p: 0.9,
    });

    if (response.choices && response.choices.length > 0) {
      return response.choices[0].message.content.trim() || 'Sorry, I could not generate a response.';
    }

    return 'Sorry, I could not find an answer to your question.';
  } catch (error) {
    console.error('❌ AI Service Error:', error);
    
    // Handle rate limit errors
    if (error.status === 429) {
      return 'I am currently receiving too many requests. Please try again in a moment.';
    }
    
    // Handle other API errors
    if (error.status) {
      return `Sorry, I encountered an error (${error.status}). Please try again.`;
    }
    
    throw error;
  }
}

module.exports = { getAIResponse };
