// Membership Requests page: table, View, Approve/Reject, pagination
let currentPage = 1;
const limit = 5;

function statusBadge(status) {
    const cls = status === 'approved' ? 'bg-success' : status === 'rejected' ? 'bg-danger' : 'badge-pending';
    return `<span class="badge ${cls}">${escapeHtml(status || 'pending')}</span>`;
}

function renderTable(applications) {
    const tbody = document.getElementById('membersTableBody');
    tbody.innerHTML = applications.map(app => `
        <tr>
            <td>${escapeHtml(app.fullName)}</td>
            <td><a href="mailto:${escapeHtml(app.email)}">${escapeHtml(app.email)}</a></td>
            <td>${escapeHtml(app.phone)}</td>
            <td>${formatDate(app.submittedAt)}</td>
            <td>${statusBadge(app.status)}</td>
            <td>
                <button type="button" class="btn btn-sm btn-outline-primary me-1 view-btn" data-id="${app._id}">View</button>
                ${app.status === 'pending' ? `
                    <button type="button" class="btn btn-sm btn-success approve-btn me-1" data-id="${app._id}" title="Approve"><i class="bi bi-check-lg"></i></button>
                    <button type="button" class="btn btn-sm btn-danger reject-btn me-1" data-id="${app._id}" title="Reject"><i class="bi bi-x-lg"></i></button>
                ` : ''}
                <button type="button" class="btn btn-sm btn-outline-danger delete-btn" data-id="${app._id}" title="Delete"><i class="bi bi-trash"></i></button>
            </td>
        </tr>
    `).join('');

    tbody.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => showMemberDetail(btn.dataset.id));
    });
    tbody.querySelectorAll('.approve-btn').forEach(btn => {
        btn.addEventListener('click', () => updateStatus(btn.dataset.id, 'approved'));
    });
    tbody.querySelectorAll('.reject-btn').forEach(btn => {
        btn.addEventListener('click', () => updateStatus(btn.dataset.id, 'rejected'));
    });
    tbody.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteMembership(btn.dataset.id));
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
                loadMembers();
            }
        });
    });
}

async function showMemberDetail(id) {
    try {
        const res = await adminFetch(`${API_BASE}/api/membership/${id}`);
        const json = await res.json();
        if (!res.ok) return;
        const app = json.data;
        const body = document.getElementById('viewMemberBody');
        body.innerHTML = `
            <p><strong>Name:</strong> ${escapeHtml(app.fullName)}</p>
            <p><strong>DOB:</strong> ${formatDate(app.dob)}</p>
            <p><strong>Gender:</strong> ${escapeHtml(app.gender)}</p>
            <p><strong>Email:</strong> <a href="mailto:${escapeHtml(app.email)}">${escapeHtml(app.email)}</a></p>
            <p><strong>Phone:</strong> ${escapeHtml(app.phone)}</p>
            <p><strong>Address:</strong> ${escapeHtml(app.address)}</p>
            <p><strong>School:</strong> ${escapeHtml(app.school)}</p>
            <p><strong>Level:</strong> ${escapeHtml(app.level)} ${app.year ? '- ' + escapeHtml(app.year) : ''}</p>
            <p><strong>Reason:</strong> ${escapeHtml(app.reason)}</p>
            <p><strong>Status:</strong> ${statusBadge(app.status)}</p>
            <div class="mt-3">
                <button type="button" class="btn btn-danger btn-sm delete-in-modal-btn" data-id="${app._id}"><i class="bi bi-trash me-1"></i>Delete</button>
            </div>
        `;
        body.querySelector('.delete-in-modal-btn')?.addEventListener('click', () => {
            bootstrap.Modal.getInstance(document.getElementById('viewMemberModal'))?.hide();
            deleteMembership(app._id);
        });
        new bootstrap.Modal(document.getElementById('viewMemberModal')).show();
    } catch (err) {
        console.error(err);
    }
}

async function updateStatus(id, status) {
    try {
        const res = await adminFetch(`${API_BASE}/api/membership/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (res.ok) {
            const statusText = status === 'approved' ? 'approved' : 'rejected';
            showAdminSuccess(`Membership application has been ${statusText} successfully.`);
            loadMembers();
        } else {
            const json = await res.json().catch(() => ({}));
            alert(json.message || `Failed to ${status} membership application.`);
        }
    } catch (err) {
        console.error(err);
        alert('Network error. Could not update membership status.');
    }
}

async function deleteMembership(id) {
    if (!confirm('Are you sure you want to delete this membership application? This action cannot be undone.')) return;
    try {
        const res = await adminFetch(`${API_BASE}/api/membership/${id}`, { method: 'DELETE' });
        const text = await res.text();
        let json = {};
        try {
            json = text ? JSON.parse(text) : {};
        } catch (_) {
            if (!res.ok) {
                alert('Delete failed. Make sure the backend server is running and has been restarted after adding the delete route.');
                return;
            }
        }
        if (res.ok) {
            showAdminSuccess('Membership application deleted successfully.');
            loadMembers();
        } else {
            alert(json.message || 'Failed to delete.');
        }
    } catch (err) {
        console.error(err);
        alert('Network error. Could not delete.');
    }
}

async function loadMembers() {
    const loading = document.getElementById('membersLoading');
    const content = document.getElementById('membersContent');
    const empty = document.getElementById('membersEmpty');

    loading.classList.remove('d-none');
    content.classList.add('d-none');

    try {
        const res = await adminFetch(`${API_BASE}/api/membership?page=${currentPage}&limit=${limit}`);
        const json = await res.json();
        loading.classList.add('d-none');
        content.classList.remove('d-none');

        if (!res.ok) {
            document.getElementById('membersTableBody').innerHTML = '<tr><td colspan="6" class="text-danger">Failed to load.</td></tr>';
            return;
        }

        const applications = json.data || [];
        const totalPages = json.totalPages || 1;

        if (applications.length === 0) {
            empty.classList.remove('d-none');
            document.getElementById('paginationNav').innerHTML = '';
            return;
        }
        empty.classList.add('d-none');
        renderTable(applications);
        renderPagination(totalPages);
    } catch (err) {
        loading.classList.add('d-none');
        content.classList.remove('d-none');
        document.getElementById('membersTableBody').innerHTML = '<tr><td colspan="6" class="text-danger">Network error.</td></tr>';
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    const ok = await requireAdmin();
    if (!ok) return;

    document.getElementById('logoutLink').addEventListener('click', function (e) {
        e.preventDefault();
        adminLogout();
    });

    loadMembers();
});
