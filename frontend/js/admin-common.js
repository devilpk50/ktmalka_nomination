// Shared for admin pages: auth check and API fetch with credentials
const API_BASE = window.location.origin;

function adminFetch(url, options = {}) {
    return fetch(url, { ...options, credentials: 'include' });
}

async function requireAdmin() {
    try {
        const res = await adminFetch(`${API_BASE}/api/admin/me`);
        if (res.status === 401) {
            window.location.href = '/admin/login';
            return false;
        }
        return true;
    } catch (e) {
        window.location.href = '/admin/login';
        return false;
    }
}

async function adminLogout() {
    await adminFetch(`${API_BASE}/api/admin/logout`, { method: 'POST' });
    window.location.href = '/admin/login';
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).replace(/\//g, '/');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showAdminSuccess(message) {
    const el = document.createElement('div');
    el.className = 'alert alert-success alert-dismissible fade show';
    el.setAttribute('role', 'alert');
    el.innerHTML = `${escapeHtml(message)}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
    const main = document.querySelector('main');
    if (main) {
        main.insertBefore(el, main.firstChild);
        setTimeout(() => { if (el.parentNode) el.remove(); }, 4000);
    } else {
        alert(message);
    }
}
