const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to allow frontend connection and parse JSON
app.use(cors());
app.use(express.json());

// The Core API Endpoint: Receives contact form data
app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;

    // 1. Basic Validation (Backend Security)
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    // 2. Prepare the payload for Telegram
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;
    
    const textMessage = `
🚨 **NEW PORTFOLIO LEAD** 🚨
👤 **Name:** ${name}
📧 **Email:** ${email}
💬 **Message:** ${message}
    `;

    // 3. Execute the Webhook routing to Telegram
    try {
        await axios.post(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
            chat_id: telegramChatId,
            text: textMessage,
            parse_mode: 'Markdown'
        });

        // 4. Send success response back to the frontend
        res.status(200).json({ success: 'Message routed successfully.' });
        console.log(`Lead processed: ${email}`);
        
    } catch (error) {
        console.error('Webhook routing failed:', error.message);
        res.status(500).json({ error: 'Internal Server Error. Routing failed.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`System Architect API running asynchronously on port ${PORT}`);
});