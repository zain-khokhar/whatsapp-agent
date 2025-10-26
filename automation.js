const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const axios = require('axios');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// WhatsApp webhook endpoint
app.post('/whatsapp', async (req, res) => {
  const incomingMsg = req.body.Body;
  const fromNumber = req.body.From;

  // AI se reply lo
  let aiResponse = '';
  try {
    const cometRes = await axios.post(
      'https://api.comet.com/v1/chat/completions',
      {
        model: 'perplexity',
        messages: [{ role: 'user', content: incomingMsg }]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.COMET_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    aiResponse = cometRes.data.choices[0].message.content;
  } catch (err) {
    aiResponse = 'AI reply mein error aagaya hai.';
  }

  // User ko reply WhatsApp pe bhejo
  await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_NUMBER,
    to: fromNumber,
    body: aiResponse
  });

  res.set('Content-Type', 'text/xml');
  res.send('<Response></Response>');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server chalu hai port', PORT);
});
