const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

// --- 1. INISIALISASI DATABASE KNEX ---
const knex = require('knex');
// Karena file index.js ini ada di dalam folder 'server', kita pakai '../' 
// untuk naik satu folder ke root dan mengambil knexfile.js
const knexConfig = require('../knexfile'); 
const db = knex(knexConfig.development);
// -------------------------------------

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to allow frontend connection and parse JSON
app.use(cors());
app.use(express.json());

// ==========================================
// 1. SENDER: The Core API Endpoint (Receives contact form data)
// ==========================================
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

// ==========================================
// 2. RECEIVER: THE WEBHOOK HANDLER (Receives incoming data from Telegram)
// ==========================================
// Tambahan 'async' di sini agar fungsi database await bisa berjalan
app.post('/api/webhook/telegram', async (req, res) => {
    // 1. Security Check: Validate the Secret Token
    // Ensure the request comes genuinely from Telegram, not an unauthorized source.
    const secretToken = req.headers['x-telegram-bot-api-secret-token'];
    if (secretToken !== process.env.TELEGRAM_SECRET_TOKEN) {
        console.warn('⚠️ Webhook Access Denied: Invalid or missing token.');
        return res.status(403).send('Forbidden');
    }

    // 2. Parse the Payload: Catch the JSON data sent by Telegram
    const update = req.body;
    
    // Check if the incoming update contains a text message
    if (update.message && update.message.text) {
        const chatId = update.message.chat.id;
        const senderName = update.message.from.first_name;
        const incomingText = update.message.text;
        
        // --- 2. TANGKAP DATA TAMBAHAN UNTUK DATABASE ---
        const telegramId = update.message.from.id;
        const username = update.message.from.username || '';

        console.log(`[Webhook Alert] New message from ${senderName} (ID: ${chatId}): "${incomingText}"`);
        
        // --- 3. MULAI KODE PENYIMPANAN DATABASE ---
        try {
            // A. Check & Insert User (Mencegah duplikasi data user)
            const userExists = await db('telegram_users').where({ telegram_id: telegramId }).first();
            if (!userExists) {
                await db('telegram_users').insert({
                    telegram_id: telegramId,
                    first_name: senderName,
                    username: username
                });
                console.log(`👤 New user saved: ${senderName}`);
            }

            // B. Insert Log Pesan
            await db('webhook_logs').insert({
                chat_id: chatId,
                message_text: incomingText,
                raw_payload: JSON.stringify(update)
            });
            console.log(`💾 Message archived to SQLite database!`);

        } catch (dbError) {
            console.error('❌ Database insertion failed:', dbError.message);
        }
        // --- AKHIR KODE PENYIMPANAN DATABASE ---

        // --- 4. LOGIKA AUTO-REPLY ---
        // Kita tangkap pesannya, ubah ke huruf kecil semua agar mudah dicek
        const pesanUser = incomingText.toLowerCase();

        if (pesanUser === '/start' || pesanUser === 'halo') {
            const replyText = `Halo ${senderName}! 👋\n\nTerima kasih sudah menghubungi. Portofolio saya sedang dalam pengembangan. Untuk urusan penawaran atau kerja sama bisnis, Anda juga bisa langsung menghubungi saya melalui email: **sales@davidkaryono.dev**\n\nKetik "bantuan" jika ingin melihat menu lainnya.`;

            try {
                // Menembak balik pesan ke user yang menyapa menggunakan token bot
                const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
                await axios.post(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
                    chat_id: chatId,
                    text: replyText,
                    parse_mode: 'Markdown'
                });
                console.log(`🤖 Auto-reply terkirim ke: ${senderName}`);
            } catch (replyError) {
                console.error('❌ Gagal mengirim auto-reply:', replyError.message);
            }
        }
        // --- AKHIR LOGIKA AUTO-REPLY ---
    }

    // 3. Respond with 200 OK (Crucial Step!)
    // Telegram needs confirmation that our server successfully received the data.
    res.status(200).send('OK');
});

// Start the server
app.listen(PORT, () => {
    console.log(`System Architect API running asynchronously on port ${PORT}`);
});