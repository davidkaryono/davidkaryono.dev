document.getElementById('loginForm').addEventListener('submit', async (e) => {
    // Mencegah browser melakukan reload halaman saat tombol ditekan
    e.preventDefault(); 

    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;
    const errorDiv = document.getElementById('errorMessage');

    try {
        // Mengetuk pintu server Node.js kita
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: usernameInput, password: passwordInput })
        });

        const data = await response.json();

        if (response.ok) {
            // Jika server memberikan lampu hijau, simpan "Kartu Akses" (Token) di saku browser
            localStorage.setItem('adminToken', data.token);
            
            // Pindahkan pengunjung ke halaman Dashboard
            window.location.href = '/dashboard.html'; 
        } else {
            // Jika kata sandi salah, tampilkan pesan error dari server
            errorDiv.textContent = data.error || 'Login failed.';
            errorDiv.classList.remove('hidden');
        }
    } catch (error) {
        errorDiv.textContent = 'System error. Cannot connect to server.';
        errorDiv.classList.remove('hidden');
    }
});