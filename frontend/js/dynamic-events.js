document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('latestEventsContainer');
    if (!container) return;

    try {
        const res = await fetch('/api/events');
        if (!res.ok) throw new Error('Failed to fetch events');
        
        const events = await res.json();
        
        // Filter out past events, maybe? Or just get the latest 3
        const latestEvents = events.slice(0, 3);
        
        container.innerHTML = '';
        
        if (latestEvents.length === 0) {
            container.innerHTML = `<div class="col-12 text-center text-muted py-5">No upcoming events at the moment.</div>`;
            return;
        }

        latestEvents.forEach(evt => {
            const dateStr = evt.date || 'TBD';
            const locationStr = evt.location || 'TBD';
            const badgeColor = evt.status === 'Upcoming' ? 'bg-primary' : evt.status === 'Past Event' ? 'bg-secondary' : 'bg-success';
            const status = evt.status || 'Upcoming';
            const imgUrl = evt.image_url ? (evt.image_url.startsWith('http') || evt.image_url.startsWith('/') ? evt.image_url : '/' + evt.image_url) : '/images/placeholder.jpg';
            
            const cardHTML = `
                <div class="col-md-6 col-lg-4">
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
            container.insertAdjacentHTML('beforeend', cardHTML);
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = `<div class="col-12 text-center text-danger py-5">Could not load latest events. Please try again later.</div>`;
    }
});
