// Newsletter Subscribers page: table with pagination, delete with confirm
let currentPage = 1;
const limit = 5;

function renderTable(subscribers, startIndex) {
    const tbody = document.getElementById('newsletterTableBody');
    tbody.innerHTML = subscribers.map((sub, index) => `
        <tr>
            <td>${startIndex + index + 1}</td>
            <td><a href="mailto:${escapeHtml(sub.email)}">${escapeHtml(sub.email)}</a></td>
            <td>
                <span class="badge ${sub.active ? 'badge-active' : 'badge-inactive'}">
                    ${sub.active ? 'Active' : 'Unsubscribed'}
                </span>
            </td>
            <td>${formatDate(sub.subscribedAt)}</td>
            <td>
                <button type="button" class="btn btn-sm btn-outline-danger delete-btn" data-id="${sub._id}" title="Delete"><i class="bi bi-trash"></i></button>
            </td>
        </tr>
    `).join('');

    tbody.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteSubscriber(btn.dataset.id));
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
                loadSubscribers();
            }
        });
    });
}

async function deleteSubscriber(id) {
    if (!confirm('Are you sure you want to delete this subscriber? This action cannot be undone.')) return;
    try {
        const res = await adminFetch(`${API_BASE}/api/newsletter/${id}`, { method: 'DELETE' });
        const text = await res.text();
        let json = {};
        try {
            json = text ? JSON.parse(text) : {};
        } catch (_) {
            if (!res.ok) {
                alert('Delete failed. Make sure the backend server is running and has been restarted.');
                return;
            }
        }
        if (res.ok) {
            showAdminSuccess('Subscriber removed and notification email sent.');
            loadSubscribers();
        } else {
            alert(json.message || 'Failed to delete.');
        }
    } catch (err) {
        console.error(err);
        alert('Network error. Could not delete.');
    }
}

async function loadSubscribers() {
    const loading = document.getElementById('newsletterLoading');
    const content = document.getElementById('newsletterContent');
    const empty = document.getElementById('newsletterEmpty');

    loading.classList.remove('d-none');
    content.classList.add('d-none');

    try {
        const res = await adminFetch(`${API_BASE}/api/newsletter/all?page=${currentPage}&limit=${limit}`);
        const json = await res.json();
        loading.classList.add('d-none');
        content.classList.remove('d-none');

        if (!res.ok) {
            document.getElementById('newsletterTableBody').innerHTML = '<tr><td colspan="5" class="text-danger">Failed to load.</td></tr>';
            return;
        }

        const subscribers = json.data || [];
        const totalPages = json.totalPages || 1;
        const startIndex = (currentPage - 1) * limit;

        if (subscribers.length === 0 && currentPage === 1) {
            empty.classList.remove('d-none');
            document.getElementById('paginationNav').innerHTML = '';
            return;
        }

        // If current page has no results but it's not page 1, go back
        if (subscribers.length === 0 && currentPage > 1) {
            currentPage = Math.max(1, currentPage - 1);
            loadSubscribers();
            return;
        }

        empty.classList.add('d-none');
        renderTable(subscribers, startIndex);
        renderPagination(totalPages);
    } catch (err) {
        loading.classList.add('d-none');
        content.classList.remove('d-none');
        document.getElementById('newsletterTableBody').innerHTML = '<tr><td colspan="5" class="text-danger">Network error.</td></tr>';
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    const ok = await requireAdmin();
    if (!ok) return;

    document.getElementById('logoutLink').addEventListener('click', function (e) {
        e.preventDefault();
        adminLogout();
    });

    loadSubscribers();
});
