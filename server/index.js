require('dotenv').config();
const express = require('express');
const axios = require('axios'); 
const db = require('./db'); // Meminjam Kotak Perkakas Database

// 1. IMPORT RUANGAN KHUSUS
const authRoutes = require('./routes/auth');
const leadsRoutes = require('./routes/leads');

const app = express();
const PORT = process.env.PORT || 3000;

// 2. MIDDLEWARE UMUM
app.use(express.json()); 
app.use(express.static('public')); 

// 3. PENDELEGASIAN RUTE
app.use('/api', authRoutes); 
app.use('/api', leadsRoutes); 

// ==========================================
// 4. RUTE SPESIFIK: TELEGRAM WEBHOOK 
// ==========================================
app.post('/api/webhook/telegram', async (req, res) => {
    // Validasi Keamanan
    const secretToken = req.headers['x-telegram-bot-api-secret-token'];
    if (secretToken !== process.env.TELEGRAM_SECRET_TOKEN) return res.status(403).send('Akses Ditolak!');

    // Wajib segera balas OK ke Telegram agar tidak timeout
    res.status(200).send('OK');

    const update = req.body;

    try {
        // CARA YANG BENAR 1: Ekstrak chat_id dengan aman (baik dari pesan teks maupun klik tombol)
        const chatId = update.message?.chat?.id || update.callback_query?.message?.chat?.id;

        // CARA YANG BENAR 2: Patuhi aturan NOT NULL database. Hanya simpan jika chat_id ada.
        // Gunakan laci 'raw_payload' sesuai tabel aslimu.
        if (chatId) {
            await db('webhook_logs').insert({ 
                chat_id: chatId, 
                raw_payload: JSON.stringify(update) 
            });
        }

        // LOGIKA BALASAN: Jika user mengirim pesan teks
        if (update.message && update.message.text) {
            const senderName = update.message.from.first_name;
            const pesanUser = update.message.text.toLowerCase();

            if (pesanUser === '/start' || pesanUser === 'menu' || pesanUser === 'bantuan') {
                const keyboard = {
                    inline_keyboard: [
                        [{ text: '📁 View Portfolio', url: 'https://davidkaryono.dev' }],
                        [{ text: '💰 Price List', callback_data: 'check_price' }],
                        [{ text: '📞 Contact Sales', callback_data: 'contact_sales' }]
                    ]
                };

                await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    chat_id: chatId,
                    text: `Halo ${senderName}! Pilih menu di bawah untuk bantuan:`,
                    reply_markup: JSON.stringify(keyboard)
                });
            }
        }

        // LOGIKA BALASAN: Jika user mengklik tombol
        if (update.callback_query) {
            const callbackData = update.callback_query.data;
            let responseText = "Kamu memilih sebuah opsi.";
            
            if (callbackData === 'check_price') responseText = "Price list akan dikirimkan segera.";
            if (callbackData === 'contact_sales') responseText = "Agen kami akan menghubungimu.";

            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: chatId,
                text: responseText
            });

            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
                callback_query_id: update.callback_query.id
            });
        }

    } catch (error) {
        console.error('❌ Gagal memproses webhook:', error.message);
    }
});

// 5. NYALAKAN SERVER
app.listen(PORT, () => {
    console.log(`🚀 System Architect API Online on port ${PORT}`);
});