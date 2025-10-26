const express = require('express');
const bodyParser = require('body-parser');
// const twilio = require('twilio'); // Reply ke liye iski zaroorat nahi
const axios = require('axios');
require('dotenv').config();

// const accountSid = process.env.TWILIO_ACCOUNT_SID; // Hata diya
// const authToken = process.env.TWILIO_AUTH_TOKEN; // Hata diya
// const client = twilio(accountSid, authToken); // Hata diya

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// WhatsApp webhook endpoint
app.post('/whatsapp', async (req, res) => {
  const incomingMsg = req.body.Body;
  // const fromNumber = req.body.From; // TwiML ke liye zaroori nahi

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
    console.error("AI API mein error:", err.message); // Error log karein
    aiResponse = 'AI reply mein error aagaya hai.';
  }

  // YEH HISSA BADAL GAYA HAI
  // User ko reply WhatsApp pe bhejne ke liye 'client.messages.create' istemal nahi karna
  /*
  await client.messages.create({
     from: process.env.TWILIO_WHATSAPP_NUMBER,
     to: fromNumber,
     body: aiResponse
  });
  */

  // Balkay TwiML ke zariye direct reply bhejein
  res.set('Content-Type', 'text/xml');
  res.send(`
    <Response>
      <Message>
        <Body>${aiResponse}</Body>
      </Message>
    </Response>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server chalu hai port ${PORT}`);
});