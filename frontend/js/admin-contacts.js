// Contact Messages page: table (Name, Email, Message preview, Date, View), pagination
let currentPage = 1;
const limit = 5;

function truncateMessage(msg, maxLen = 50) {
    if (!msg) return '';
    return msg.length <= maxLen ? msg : msg.substring(0, maxLen) + '........';
}

function renderTable(messages) {
    const tbody = document.getElementById('contactsTableBody');
    tbody.innerHTML = messages.map(msg => `
        <tr>
            <td>${escapeHtml(msg.name)}</td>
            <td><a href="mailto:${escapeHtml(msg.email)}">${escapeHtml(msg.email)}</a></td>
            <td class="message-preview" title="${escapeHtml(msg.message)}">${escapeHtml(truncateMessage(msg.message))}</td>
            <td>${formatDate(msg.submittedAt)}</td>
            <td>
                <button type="button" class="btn btn-sm btn-outline-primary view-btn me-1" data-id="${msg._id}">View</button>
                <button type="button" class="btn btn-sm btn-outline-danger delete-btn" data-id="${msg._id}" title="Delete"><i class="bi bi-trash"></i></button>
            </td>
        </tr>
    `).join('');

    tbody.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => showContactDetail(btn.dataset.id));
    });
    tbody.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteContact(btn.dataset.id));
    });
}

function renderPagination(totalPages) {
    const nav = document.getElementById('paginationNav');
    if (totalPages <= 1) {
        nav.innerHTML = '';
        return;
    }
    let html = '<ul class="pagination mb-0">';
    html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${currentPage - 1}">&lt;&lt;</a></li>`;
    for (let p = 1; p <= totalPages; p++) {
        html += `<li class="page-item ${p === currentPage ? 'active' : ''}"><a class="page-link" href="#" data-page="${p}">${p}</a></li>`;
    }
    html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${currentPage + 1}">&gt;&gt;</a></li>`;
    html += '</ul>';
    nav.innerHTML = html;
    nav.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const p = parseInt(this.dataset.page, 10);
            if (p >= 1 && p <= totalPages) {
                currentPage = p;
                loadContacts();
            }
        });
    });
}

async function showContactDetail(id) {
    try {
        const res = await adminFetch(`${API_BASE}/api/contact/${id}`);
        const json = await res.json();
        if (!res.ok) return;
        const msg = json.data;
        const body = document.getElementById('viewContactBody');
        body.innerHTML = `
            <p><strong>Name:</strong> ${escapeHtml(msg.name)}</p>
            <p><strong>Email:</strong> <a href="mailto:${escapeHtml(msg.email)}">${escapeHtml(msg.email)}</a></p>
            <p><strong>Date:</strong> ${formatDate(msg.submittedAt)}</p>
            <p><strong>Message:</strong></p>
            <p class="border rounded p-3 bg-light">${escapeHtml(msg.message)}</p>
            <div class="mt-3">
                <button type="button" class="btn btn-danger btn-sm delete-in-modal-btn" data-id="${msg._id}"><i class="bi bi-trash me-1"></i>Delete</button>
            </div>
        `;
        body.querySelector('.delete-in-modal-btn')?.addEventListener('click', () => {
            bootstrap.Modal.getInstance(document.getElementById('viewContactModal'))?.hide();
            deleteContact(msg._id);
        });
        new bootstrap.Modal(document.getElementById('viewContactModal')).show();
    } catch (err) {
        console.error(err);
    }
}

async function deleteContact(id) {
    if (!confirm('Are you sure you want to delete this contact message? This action cannot be undone.')) return;
    try {
        const res = await adminFetch(`${API_BASE}/api/contact/${id}`, { method: 'DELETE' });
        const text = await res.text();
        let json = {};
        try {
            json = text ? JSON.parse(text) : {};
        } catch (_) {
            // Server returned HTML (e.g. 404 page) instead of JSON
            if (!res.ok) {
                alert('Delete failed. Make sure the backend server is running and has been restarted after adding the delete route.');
                return;
            }
        }
        if (res.ok) {
            showAdminSuccess('Contact message deleted successfully.');
            loadContacts();
        } else {
            alert(json.message || 'Failed to delete.');
        }
    } catch (err) {
        console.error(err);
        alert('Network error. Could not delete.');
    }
}

async function loadContacts() {
    const loading = document.getElementById('contactsLoading');
    const content = document.getElementById('contactsContent');
    const empty = document.getElementById('contactsEmpty');

    loading.classList.remove('d-none');
    content.classList.add('d-none');

    try {
        const res = await adminFetch(`${API_BASE}/api/contact?page=${currentPage}&limit=${limit}`);
        const json = await res.json();
        loading.classList.add('d-none');
        content.classList.remove('d-none');

        if (!res.ok) {
            document.getElementById('contactsTableBody').innerHTML = '<tr><td colspan="5" class="text-danger">Failed to load.</td></tr>';
            return;
        }

        const messages = json.data || [];
        const totalPages = json.totalPages || 1;

        if (messages.length === 0) {
            empty.classList.remove('d-none');
            document.getElementById('paginationNav').innerHTML = '';
            return;
        }
        empty.classList.add('d-none');
        renderTable(messages);
        renderPagination(totalPages);
    } catch (err) {
        loading.classList.add('d-none');
        content.classList.remove('d-none');
        document.getElementById('contactsTableBody').innerHTML = '<tr><td colspan="5" class="text-danger">Network error.</td></tr>';
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    const ok = await requireAdmin();
    if (!ok) return;

    document.getElementById('logoutLink').addEventListener('click', function (e) {
        e.preventDefault();
        adminLogout();
    });

    loadContacts();
});
