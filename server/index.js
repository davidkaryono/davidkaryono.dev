const express = require('express');
const cors = require('cors');
const axios = require('axios');
const nodemailer = require('nodemailer'); // PR 3
require('dotenv').config();

const knex = require('knex');
const knexConfig = require('../knexfile'); 
const db = knex(knexConfig.development);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- MODUL: API KEY MIDDLEWARE (PR 2 Security) ---
const authenticateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey === process.env.DASHBOARD_API_KEY) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
    }
};

// --- MODUL: EMAIL TRANSPORTER (PR 3) ---
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// ==========================================
// 1. SENDER: Lead Form & Auto Email (Keamanan Ditingkatkan)
// ==========================================
app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;

    // Validasi input dasar
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        // LANGKAH 1: Amankan ke Database SQLite (Harddisk)
        // Catatan: Pastikan kamu sudah membuat tabel 'portfolio_leads' di file migrasi Knex-mu
        await db('portfolio_leads').insert({
            name: name,
            email: email,
            message: message
        });

        // LANGKAH 2: Balas ke Browser Pengunjung (Tutup Telepon)
        // Kita merespons sukses HANYA JIKA data sudah aman di database
        res.status(200).json({ success: 'Pesan Anda berhasil diamankan dan sedang diproses.' });

        // LANGKAH 3: Jalankan Notifikasi di Latar Belakang (Tidak membuat pengunjung menunggu)
        try {
            // Notifikasi Telegram
            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: process.env.TELEGRAM_CHAT_ID,
                text: `🚨 **NEW LEAD**\n👤: ${name}\n📧: ${email}\n💬: ${message}`,
                parse_mode: 'Markdown'
            });

            // Kirim Email Bisnis SMTP
            await transporter.sendMail({
                from: `"Portfolio System" <${process.env.SMTP_USER}>`,
                to: "sales@davidkaryono.dev",
                subject: `New Lead from ${name}`,
                text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
            });
            console.log(`✅ Laporan email & Telegram terkirim untuk: ${email}`);
        } catch (bgError) {
            // Jika Telegram/Email gagal, biarkan saja log merah di server.
            // Yang terpenting data klien sudah selamat di database!
            console.error('❌ Peringatan: Gagal mengirim notifikasi latar belakang:', bgError.message);
        }

    } catch (dbError) {
        // Jika gagal simpan ke database, tolak request pengunjung
        console.error('❌ Gagal menyimpan ke database:', dbError.message);
        res.status(500).json({ error: 'Sistem sedang gangguan, gagal menyimpan pesan Anda.' });
    }
});

// ==========================================
// 2. DASHBOARD API: Get Leads (PR 2)
// ==========================================
app.get('/api/leads', authenticateApiKey, async (req, res) => {
    try {
        const leads = await db('webhook_logs').orderBy('created_at', 'desc').limit(50);
        res.json(leads);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
});

// ==========================================
// 3. RECEIVER: Webhook & Keyboards (PR 1)
// ==========================================
app.post('/api/webhook/telegram', async (req, res) => {
    const secretToken = req.headers['x-telegram-bot-api-secret-token'];
    if (secretToken !== process.env.TELEGRAM_SECRET_TOKEN) return res.status(403).send('Forbidden');

    const update = req.body;

    // Logika Pesan Teks
    if (update.message && update.message.text) {
        const chatId = update.message.chat.id;
        const senderName = update.message.from.first_name;

        // PR 1: Balas dengan Tombol (Keyboard)
        const keyboard = {
            inline_keyboard: [
                [
                    { text: '📁 View Portfolio', url: 'https://davidkaryono.dev' },
                    { text: '💰 Price List', callback_data: 'check_price' }
                ],
                [
                    { text: '📞 Contact Sales', callback_data: 'contact_sales' }
                ]
            ]
        };

        await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: chatId,
            text: `Halo ${senderName}! Pilih menu di bawah untuk bantuan:`,
            reply_markup: JSON.stringify(keyboard)
        });
    }

    // Logika Klik Tombol (Callback Query)
    if (update.callback_query) {
        const callbackData = update.callback_query.data;
        const chatId = update.callback_query.message.chat.id;

        let responseText = "You selected an option.";
        if (callbackData === 'check_price') responseText = "Price list will be sent to your email.";
        if (callbackData === 'contact_sales') responseText = "Our agent will contact you soon.";

        await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: chatId,
            text: responseText
        });

        // Wajib dijawab agar icon loading di Telegram hilang
        await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
            callback_query_id: update.callback_query.id
        });
    }

    res.status(200).send('OK');
});

app.listen(PORT, () => console.log(`System Architect API Online on port ${PORT}`));