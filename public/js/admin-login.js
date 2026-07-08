// Admin Login - submit credentials and redirect to dashboard
const API_BASE = window.location.origin;

// If already logged in, redirect to dashboard
fetch(`${API_BASE}/api/admin/me`, { credentials: 'include' })
    .then(r => r.json())
    .then(data => { if (data.loggedIn) window.location.href = '/admin'; });

document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');

    errorEl.classList.add('d-none');
    btn.disabled = true;
    btn.textContent = 'Logging in...';

    try {
        const res = await fetch(`${API_BASE}/api/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });
        const json = await res.json();

        if (res.ok && json.success) {
            errorEl.classList.add('d-none');
            const successEl = document.getElementById('loginSuccess');
            const successMsg = document.getElementById('loginSuccessMessage');
            successMsg.textContent = 'Login successful! Redirecting to dashboard...';
            successEl.classList.remove('d-none');
            setTimeout(() => {
                window.location.href = '/admin';
            }, 1500);
            return;
        }
        errorEl.textContent = json.message || 'Invalid email or password.';
        errorEl.classList.remove('d-none');
    } catch (err) {
        errorEl.textContent = 'Network error. Please try again.';
        errorEl.classList.remove('d-none');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Login';
    }
});
