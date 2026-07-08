document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('projectsGrid');
    const paginationContainer = document.getElementById('projectsPagination');
    if (!container) return;

    let projects = [];
    let currentPage = 1;
    const itemsPerPage = 6;

    try {
        const res = await fetch('/api/projects');
        if (!res.ok) throw new Error('Failed to fetch projects');
        projects = await res.json();
        
        if (projects.length === 0) {
            container.innerHTML = `<div class="col-12 text-center text-muted py-5">No projects available at the moment.</div>`;
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

        renderPage(1);

    } catch (error) {
        console.error(error);
        container.innerHTML = `<div class="col-12 text-center text-danger py-5">Error loading projects. Please try again later.</div>`;
    }

    function renderPage(page) {
        currentPage = page;
        const totalPages = Math.ceil(projects.length / itemsPerPage);
        
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageItems = projects.slice(startIndex, endIndex);

        container.innerHTML = '';

        pageItems.forEach(project => {
            const dateStr = project.date || 'TBD';
            const badgeColor = project.is_signature ? 'bg-primary' : 'bg-secondary';
            const badgeText = project.is_signature ? 'Signature Project' : (project.category || 'Project');
            
            const statusIcon = project.status === 'Completed' 
                ? '<i class="bi bi-check-circle-fill text-success"></i> Completed' 
                : (project.status === 'Ongoing' ? '<i class="bi bi-arrow-repeat text-primary"></i> Ongoing' : '<i class="bi bi-calendar-event text-secondary"></i> Upcoming');
            
            const imgUrl = project.image_url ? (project.image_url.startsWith('http') || project.image_url.startsWith('/') ? project.image_url : '/' + project.image_url) : '/images/placeholder.jpg';
            
            const fallbackIcon = project.is_signature ? 'bi-heart-pulse-fill' : 'bi-ribbon-fill';
            const fallbackBg = project.is_signature ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
            
            const cardHTML = `
                <div class="col-md-6 col-lg-4">
                    <div class="event-card shadow-sm rounded-lg overflow-hidden h-100 transition-hover bg-white">
                        <div class="project-image-wrapper" style="height: 200px; position: relative;">
                            <img src="${imgUrl}" alt="${project.title}" class="img-fluid"
                                style="width: 100%; height: 100%; object-fit: cover;"
                                onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div class="project-image-fallback"
                                style="display: none; background: ${fallbackBg}; height: 100%; width: 100%; position: absolute; top: 0; left: 0; align-items: center; justify-content: center;">
                                <i class="bi ${fallbackIcon} text-white" style="font-size: 48px;"></i>
                            </div>
                        </div>
                        <div class="event-body p-4 d-flex flex-column" style="height: calc(100% - 200px);">
                            <div>
                                <span class="badge ${badgeColor} mb-2">${badgeText}</span>
                                <h5 class="fw-bold mb-2">${project.title}</h5>
                                <p class="text-muted small mb-3">
                                    <i class="bi bi-calendar3 me-1"></i> ${dateStr}
                                </p>
                                <p class="text-muted small" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${project.description || ''}</p>
                            </div>
                            <div class="d-flex justify-content-between align-items-center mt-auto pt-3">
                                <small class="text-muted">${statusIcon}</small>
                                <a href="project-detail.html?id=${project.id}" class="btn btn-sm btn-primary">View More</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += cardHTML;
        });

        renderPagination(totalPages);
    }

    function renderPagination(totalPages) {
        if (!paginationContainer) return;

        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let html = '<nav aria-label="Projects pagination"><ul class="pagination justify-content-center mb-0">';
        
        // Previous button
        html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${currentPage - 1}" aria-label="Previous">
                        <span aria-hidden="true">&laquo;</span>
                    </a>
                 </li>`;

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                     </li>`;
        }

        // Next button
        html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${currentPage + 1}" aria-label="Next">
                        <span aria-hidden="true">&raquo;</span>
                    </a>
                 </li>`;

        html += '</ul></nav>';
        paginationContainer.innerHTML = html;

        // Add event listeners
        const pageLinks = paginationContainer.querySelectorAll('.page-link[data-page]');
        pageLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(link.getAttribute('data-page'));
                if (page >= 1 && page <= totalPages && page !== currentPage) {
                    renderPage(page);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        });
    }
});
