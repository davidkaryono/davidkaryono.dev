const express = require('express');
const router = express.Router();

// ==========================================
// RUANG AUTHENTICATION (Login)
// Rute aslinya: /api/login
// ==========================================
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    const adminUsername = 'david'; 
    const adminPassword = process.env.DASHBOARD_API_KEY;

    if (username === adminUsername && password === adminPassword) {
        res.status(200).json({ 
            message: 'Login sukses',
            token: process.env.DASHBOARD_API_KEY 
        });
        console.log('🔓 Akses masuk diberikan kepada Admin.');
    } else {
        res.status(401).json({ error: 'Username atau Password salah!' });
        console.warn(`⚠️ Peringatan: Percobaan login gagal dari username: ${username}`);
    }
});

// WAJIB: Mengekspor ruangan ini agar bisa dipanggil oleh Resepsionis (index.js)
module.exports = router;