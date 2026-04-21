document.getElementById('contactForm').addEventListener('submit', async function(e) {
    e.preventDefault(); // Mencegah website reload saat tombol ditekan
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
    const statusDiv = document.getElementById('statusMessage');
    const submitBtn = document.querySelector('button');

    submitBtn.textContent = 'Routing...';
    submitBtn.disabled = true;

    try {
        // Ini menembak ke server Node.js milikmu yang sedang menyala!
        const response = await fetch('http://localhost:3000/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, message })
        });

        if (response.ok) {
            statusDiv.textContent = '> System message: Delivered securely to David\'s Telegram.';
            statusDiv.className = 'success';
            document.getElementById('contactForm').reset();
        } else {
            statusDiv.textContent = '> System error: Handshake failed.';
            statusDiv.className = 'error';
        }
    } catch (error) {
        statusDiv.textContent = '> Network error: Make sure the Node.js server is running!';
        statusDiv.className = 'error';
    } finally {
        submitBtn.textContent = 'Execute Request( )';
        submitBtn.disabled = false;
    }
});