// File: server/db.js
const knex = require('knex');

// Konfigurasi Database SQLite
const db = knex({
    client: 'sqlite3',
    connection: {
        filename: './dev.sqlite3'
    },
    useNullAsDefault: true
});

// Ekspor agar bisa dipakai oleh file lain
module.exports = db;