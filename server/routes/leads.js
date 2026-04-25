const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db'); 

// Middleware Loket Rahasia 
const authenticateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey && apiKey === process.env.DASHBOARD_API_KEY) {
        next();
    } else {
        res.status(401).json({ error: 'Akses Ditolak: API Key tidak valid.' });
    }
};

// ==========================================
// 1. Rute Menerima Form Website (/api/contact)
// ==========================================
router.post('/contact', async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Semua kolom wajib diisi.' });
    }

    try {
        // Amankan ke laci SQLite
        await db('portfolio_leads').insert({ name, email, message });

        // TUTUP TELEPON SEGERA (Ini yang mencegah "Stuck" di browser)
        res.status(200).json({ success: 'Pesan Anda berhasil diamankan dan sedang diproses.' });

        // Jalankan Notifikasi Telegram diam-diam di latar belakang
        try {
            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: process.env.TELEGRAM_CHAT_ID,
                text: `🚨 **NEW LEAD**\n👤: ${name}\n📧: ${email}\n💬: ${message}`
            });
        } catch (bgError) {
            console.error('❌ Gagal mengirim Telegram:', bgError.message);
        }

    } catch (dbError) {
        console.error('❌ Gagal menyimpan ke database:', dbError.message);
        // Jika belum sempat "tutup telepon", beritahu error ke browser
        if (!res.headersSent) {
            res.status(500).json({ error: 'Sistem sedang gangguan, gagal menyimpan pesan Anda.' });
        }
    }
});

// ==========================================
// 2. Rute Mengirim Data ke Dashboard Admin (/api/leads)
// ==========================================
router.get('/leads', authenticateApiKey, async (req, res) => {
    try {
        // Tarik semua data dari laci SQLite, urutkan dari yang paling baru
        const leads = await db('portfolio_leads').select('*').orderBy('created_at', 'desc');
        res.status(200).json(leads);
    } catch (error) {
        console.error('❌ Gagal mengambil data dashboard:', error.message);
        res.status(500).json({ error: 'Gagal mengambil data dari database.' });
    }
});

module.exports = router;