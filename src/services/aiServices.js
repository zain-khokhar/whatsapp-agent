
const fetch = require('node-fetch');

/**
 * Get AI response from Perplexity API using the search endpoint (no model required)
 * Mirrors the client-side logic used in `index.html`.
 * @param {string} userMessage - User's message
 * @returns {Promise<string>} AI response
 */
async function getAIResponse(userMessage) {
  try {
    const res = await fetch('https://api.perplexity.ai/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY || process.env.COMET_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: userMessage,
        max_results: 1,
        country: 'PK'
      })
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('❌ Perplexity API error:', data);
      if (res.status === 429) return 'I am currently receiving too many requests. Please try again in a moment.';
      return `Sorry, I encountered an error (${res.status}). Please try again.`;
    }

    // Prefer structured answer text
    let answer = '';
    if (data.answer) {
      if (typeof data.answer === 'string') answer = data.answer;
      else if (data.answer.text) answer = data.answer.text;
    }

    // Fallback to first result's snippet/summary/content
    if (!answer && data.results && data.results.length > 0) {
      const r = data.results[0];
      answer = r.answer || r.snippet || r.summary || r.excerpt || r.content || '';
      if (r.url) {
        if (answer) answer += `\n\nSource: ${r.url}`;
        else answer = `${r.title || 'Result'}\n${r.url}`;
      }
    }

    if (!answer) return 'Sorry, I could not find an answer to your question.';

    return answer.trim();
  } catch (err) {
    console.error('❌ AI Service Error:', err);
    throw err;
  }
}

module.exports = { getAIResponse };
 