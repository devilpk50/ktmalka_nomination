document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('latestProjectsContainer');
    if (!container) return;

    try {
        const res = await fetch('/api/projects');
        if (!res.ok) throw new Error('Failed to fetch projects');
        
        const projects = await res.json();
        
        // Get the latest 3 projects
        const latestProjects = projects.slice(0, 3);
        
        container.innerHTML = '';
        
        if (latestProjects.length === 0) {
            container.innerHTML = `<div class="col-12 text-center text-muted py-5">No featured projects at the moment.</div>`;
            return;
        }

        latestProjects.forEach(project => {
            const dateStr = project.date || 'TBD'; // This handles Duration/Focus/etc.
            const badgeColor = project.is_signature ? 'bg-primary' : 'bg-secondary';
            const badgeText = project.is_signature ? 'Signature Project' : (project.category || 'Project');
            
            const statusIcon = project.status === 'Completed' 
                ? '<i class="bi bi-check-circle-fill text-success"></i> Completed' 
                : (project.status === 'Ongoing' ? '<i class="bi bi-arrow-repeat text-primary"></i> Ongoing' : '<i class="bi bi-calendar-event text-secondary"></i> Upcoming');
            
            const imgUrl = project.image_url ? (project.image_url.startsWith('http') || project.image_url.startsWith('/') ? project.image_url : '/' + project.image_url) : '/images/placeholder.jpg';
            
            // Generate initials or icon for fallback based on title
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
                                    ${dateStr}
                                </p>
                                <p class="text-muted small">${project.description || ''}</p>
                            </div>
                            <div class="d-flex justify-content-between align-items-center mt-auto pt-3">
                                <small class="text-muted">${statusIcon}</small>
                                <a href="project-detail.html?id=${project.id}" class="btn btn-sm btn-primary">Learn More</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', cardHTML);
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = `<div class="col-12 text-center text-danger py-5">Could not load featured projects. Please try again later.</div>`;
    }
});
