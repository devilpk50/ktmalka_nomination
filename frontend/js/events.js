document.addEventListener('DOMContentLoaded', async () => {
    function formatDate(dateStr) {
        if (!dateStr) return 'TBD';
        const d = new Date(dateStr);
        if (isNaN(d)) return dateStr;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    const container = document.getElementById('eventsGrid');
    const paginationContainer = document.getElementById('eventsPagination');
    if (!container) return;

    let allEvents = [];
    let currentPage = 1;
    const itemsPerPage = 6;

    async function loadEvents() {
        try {
            const res = await fetch('/api/events');
            if (!res.ok) throw new Error('Failed to fetch events');
            allEvents = await res.json();
            
            if (allEvents.length === 0) {
                container.innerHTML = `<div class="col-12 text-center text-muted py-5">No events found.</div>`;
                if (paginationContainer) paginationContainer.innerHTML = '';
                return;
            }
            
            showPage(1);
        } catch (err) {
            console.error(err);
            container.innerHTML = `<div class="col-12 text-center text-danger py-5">Could not load events. Please try again later.</div>`;
        }
    }

    function showPage(page) {
        currentPage = page;
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const eventsToShow = allEvents.slice(startIndex, endIndex);

        container.innerHTML = eventsToShow.map(evt => {
            const dateStr = formatDate(evt.date);
            const locationStr = evt.location || 'TBD';
            const status = evt.status || 'Upcoming';
            let badgeColor = 'bg-primary';
            if (status === 'Ongoing') badgeColor = 'bg-success';
            if (status === 'Past Event') badgeColor = 'bg-secondary';
            
            const imgUrl = evt.image_url ? (evt.image_url.startsWith('http') || evt.image_url.startsWith('/') ? evt.image_url : '/' + evt.image_url) : '/images/placeholder.jpg';

            return `
                <div class="col-md-4">
                    <div class="event-card shadow-sm rounded-lg overflow-hidden h-100 transition-hover">
                        <div class="event-image" style="height: 200px; overflow: hidden;">
                            <img src="${imgUrl}" alt="${evt.title}"
                                class="img-fluid w-100 h-100" style="object-fit: cover;"
                                onerror="this.src='/images/placeholder.jpg'">
                        </div>
                        <div class="event-body p-4">
                            <span class="badge ${badgeColor} mb-2">${status}</span>
                            <h5 class="fw-bold mb-2">${evt.title}</h5>
                            <p class="text-muted small mb-3"><strong>Date:</strong> ${dateStr} &middot;
                                <strong>Location:</strong> ${locationStr}
                            </p>
                            <p class="text-muted small">${evt.description || 'Join us for this exciting event!'}</p>
                            <div class="d-flex justify-content-between align-items-center">
                                <small class="text-muted"><i class="bi bi-calendar3"></i> ${dateStr}</small>
                                <a href="event-detail.html?id=${evt.id}" class="btn btn-sm btn-primary">View Details</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        renderPagination(Math.ceil(allEvents.length / itemsPerPage));
    }

    function renderPagination(totalPages) {
        if (!paginationContainer) return;
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let html = '<nav aria-label="Events pagination"><ul class="pagination justify-content-center mb-0">';
        
        // Previous
        html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage - 1}" aria-label="Previous">
                <span aria-hidden="true">&laquo;</span>
            </a>
        </li>`;

        // Pages
        for (let i = 1; i <= totalPages; i++) {
            html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>`;
        }

        // Next
        html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage + 1}" aria-label="Next">
                <span aria-hidden="true">&raquo;</span>
            </a>
        </li>`;

        html += '</ul></nav>';
        paginationContainer.innerHTML = html;

        // Add event listeners
        paginationContainer.querySelectorAll('.page-link[data-page]').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const page = parseInt(this.getAttribute('data-page'));
                if (page >= 1 && page <= totalPages && page !== currentPage) {
                    showPage(page);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        });
    }

    loadEvents();
});
