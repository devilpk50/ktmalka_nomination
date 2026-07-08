// Admin Dashboard - Fetch and display contact & membership data from MongoDB

const API_BASE = window.location.origin;

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function loadContactMessages() {
    const loading = document.getElementById('contactLoading');
    const content = document.getElementById('contactContent');
    const empty = document.getElementById('contactEmpty');
    const tbody = document.getElementById('contactTableBody');
    const countEl = document.getElementById('contactCount');

    try {
        const res = await fetch(`${API_BASE}/api/contact`);
        const json = await res.json();
        loading.classList.add('d-none');

        if (!res.ok) {
            countEl.textContent = 'Error';
            content.classList.remove('d-none');
            tbody.innerHTML = '<tr><td colspan="4" class="text-danger">Failed to load contact messages.</td></tr>';
            return;
        }

        const messages = json.data || [];
        countEl.textContent = messages.length;

        if (messages.length === 0) {
            content.classList.remove('d-none');
            empty.classList.remove('d-none');
            return;
        }

        content.classList.remove('d-none');
        empty.classList.add('d-none');
        tbody.innerHTML = messages.map(msg => `
            <tr>
                <td class="text-nowrap">${formatDate(msg.submittedAt)}</td>
                <td>${escapeHtml(msg.name)}</td>
                <td><a href="mailto:${escapeHtml(msg.email)}">${escapeHtml(msg.email)}</a></td>
                <td class="text-break" style="max-width: 300px;">${escapeHtml(msg.message)}</td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Contact load error:', err);
        loading.classList.add('d-none');
        content.classList.remove('d-none');
        countEl.textContent = '-';
        tbody.innerHTML = '<tr><td colspan="4" class="text-danger">Network error. Is the server running?</td></tr>';
    }
}

function statusBadge(status) {
    const cls = status === 'approved' ? 'bg-success' : status === 'rejected' ? 'bg-danger' : 'badge-pending';
    return `<span class="badge ${cls}">${escapeHtml(status || 'pending')}</span>`;
}

async function loadMembershipApplications() {
    const loading = document.getElementById('membershipLoading');
    const content = document.getElementById('membershipContent');
    const empty = document.getElementById('membershipEmpty');
    const tbody = document.getElementById('membershipTableBody');
    const countEl = document.getElementById('membershipCount');

    try {
        const res = await fetch(`${API_BASE}/api/membership`);
        const json = await res.json();
        loading.classList.add('d-none');

        if (!res.ok) {
            countEl.textContent = 'Error';
            content.classList.remove('d-none');
            tbody.innerHTML = '<tr><td colspan="7" class="text-danger">Failed to load membership applications.</td></tr>';
            return;
        }

        const applications = json.data || [];
        countEl.textContent = applications.length;

        if (applications.length === 0) {
            content.classList.remove('d-none');
            empty.classList.remove('d-none');
            return;
        }

        content.classList.remove('d-none');
        empty.classList.add('d-none');
        tbody.innerHTML = applications.map(app => `
            <tr>
                <td class="text-nowrap">${formatDate(app.submittedAt)}</td>
                <td>${escapeHtml(app.fullName)}</td>
                <td><a href="mailto:${escapeHtml(app.email)}">${escapeHtml(app.email)}</a></td>
                <td>${escapeHtml(app.phone)}</td>
                <td>${escapeHtml(app.school)} / ${escapeHtml(app.level)}${app.year ? ' - ' + escapeHtml(app.year) : ''}</td>
                <td>${statusBadge(app.status)}</td>
                <td class="text-break" style="max-width: 200px;">${escapeHtml(app.reason)}</td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Membership load error:', err);
        loading.classList.add('d-none');
        content.classList.remove('d-none');
        countEl.textContent = '-';
        tbody.innerHTML = '<tr><td colspan="7" class="text-danger">Network error. Is the server running?</td></tr>';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    loadContactMessages();
    loadMembershipApplications();
});
