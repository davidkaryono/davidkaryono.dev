// 1. Fungsi Satpam Pintu Masuk
function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        // Jika tidak ada token, tendang ke halaman login
        window.location.href = '/login.html';
        return null;
    }
    return token;
}

// 2. Fungsi Pengambil & Penggambar Data
async function loadLeads() {
    const token = localStorage.getItem('adminToken'); // Ambil token login
    const tableBody = document.getElementById('leadsTableBody');

    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    try {
        // PASTI KAN JALUR INI: /api/leads (sesuai dengan index.js)
        const response = await fetch('/api/leads', {
            method: 'GET',
            headers: {
                'x-api-key': token, // Kirim token di Header
                'Content-Type': 'application/json'
            }
        });

        // Jika peladen menolak (401/403)
        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Server menolak permintaan:', errorData);
            throw new Error(errorData.error || 'Gagal mengambil data');
        }

        const leads = await response.json();
        
        // Membersihkan tabel sebelum menggambar
        tableBody.innerHTML = ''; 

        if (leads.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4">Belum ada pesan yang masuk.</td></tr>';
            return;
        }

        // Gambar data ke tabel
        leads.forEach(lead => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-gray-50 border-b border-gray-200";
            tr.innerHTML = `
                <td class="py-4 px-6">${new Date(lead.created_at || Date.now()).toLocaleString('id-ID')}</td>
                <td class="py-4 px-6 font-semibold">${lead.name}</td>
                <td class="py-4 px-6 text-blue-600">${lead.email}</td>
                <td class="py-4 px-6 text-gray-600">${lead.message}</td>
            `;
            tableBody.appendChild(tr);
        });

    } catch (error) {
        console.error('❌ Catch Error:', error);
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-red-500">Gagal mengambil data: ${error.message}</td></tr>`;
    }
}
// 3. Jalankan fungsi loadLeads() segera setelah file ini dibaca browser
loadLeads();

// ==========================================
// 4. Fitur Logout (Menghapus Kartu Akses)
// ==========================================
document.getElementById('logoutBtn').addEventListener('click', () => {
    // 1. Hapus token dari brankas browser
    localStorage.removeItem('adminToken');
    
    // 2. Tendang kembali ke pintu depan
    window.location.href = '/login.html';
});