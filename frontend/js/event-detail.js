document.addEventListener('DOMContentLoaded', async function() {
    function formatDate(dateStr) {
        if (!dateStr) return 'TBD';
        const d = new Date(dateStr);
        if (isNaN(d)) return dateStr;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    
    if (!eventId) {
        window.location.href = 'events.html';
        return;
    }
    
    try {
        const res = await fetch('/api/events');
        if (!res.ok) throw new Error('Failed to fetch events');
        
        const events = await res.json();
        const event = events.find(e => e.id == eventId);
        
        if (!event) {
            window.location.href = 'events.html';
            return;
        }
        
        // Update page title
        document.title = `${event.title} - Leo Club of Kathmandu Alka`;
        
        // Setup image overlay background fallback if needed
        const eventHero = document.getElementById('eventHero');
        if (event.status === 'Past Event') {
            eventHero.classList.add('light-background');
        }
        
        document.getElementById('eventTitle').textContent = event.title;
        document.getElementById('eventSubtitle').textContent = event.category || '';
        
        // Update event image
        const eventImage = document.getElementById('eventImage');
        if (event.image_url) {
            const imgUrl = event.image_url.startsWith('http') || event.image_url.startsWith('/') ? event.image_url : '/' + event.image_url;
            eventImage.style.background = 'none';
            eventImage.style.display = 'block';
            eventImage.style.alignItems = 'unset';
            eventImage.style.justifyContent = 'unset';
            eventImage.innerHTML = `<img src="${imgUrl}" alt="${event.title}" class="detail-image" onerror="this.src='/images/placeholder.jpg'">`;
        } else {
            eventImage.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            eventImage.style.display = 'flex';
            eventImage.style.alignItems = 'center';
            eventImage.style.justifyContent = 'center';
            eventImage.innerHTML = `<i class="bi bi-calendar-event text-white" style="font-size: 80px;"></i>`;
        }
        
        // Update short description (fallback)
        const descriptionElement = document.getElementById('eventDescription');
        if (descriptionElement) {
            descriptionElement.textContent = event.description || 'No description provided.';
        }
        
        // Update sidebar information
        const dateElement = document.getElementById('eventDate');
        if (dateElement) dateElement.textContent = formatDate(event.date);
        
        const timeElement = document.getElementById('eventTime');
        if (timeElement) timeElement.textContent = event.time || 'TBD';
        
        const locationElement = document.getElementById('eventLocation');
        if (locationElement) locationElement.textContent = event.location || 'TBD';
        
        const categoryElement = document.getElementById('eventCategory');
        if (categoryElement) categoryElement.textContent = event.category || '-';
        
        // Update status badge
        const statusElement = document.getElementById('eventStatus');
        if (statusElement) {
            const badgeColor = event.status === 'Upcoming' ? 'bg-primary' : (event.status === 'Ongoing' ? 'bg-success' : 'bg-secondary');
            const statusBadge = `<span class="badge ${badgeColor}">${event.status || 'Upcoming'}</span>`;
            statusElement.innerHTML = statusBadge;
        }
        
        // Update full details
        const detailsContainer = document.getElementById('eventDetails');
        if (detailsContainer) {
            if (event.details && event.details.trim() !== '') {
                detailsContainer.parentElement.style.display = 'block';
                // Split by new line, check if it looks like a list or just paragraphs
                const detailsHtml = event.details.replace(/\n/g, '<br>');
                detailsContainer.innerHTML = `<p>${detailsHtml}</p>`;
            } else {
                detailsContainer.parentElement.style.display = 'none';
            }
        }
        
        // Update objectives
        const objectivesElement = document.getElementById('eventObjectives');
        if (objectivesElement) {
            if (event.objectives && event.objectives.trim() !== '') {
                objectivesElement.parentElement.style.display = 'block';
                const objectivesHtml = event.objectives.split('\n')
                    .filter(obj => obj.trim() !== '')
                    .map(objective => `<li class="mb-3"><i class="bi bi-arrow-right-circle-fill text-primary me-2"></i>${objective}</li>`)
                    .join('');
                objectivesElement.innerHTML = objectivesHtml;
            } else {
                objectivesElement.parentElement.style.display = 'none';
            }
        }
        
        // Update contact information
        const contactElement = document.getElementById('eventContact');
        if (contactElement) {
            if (event.contact_info && event.contact_info.trim() !== '') {
                contactElement.parentElement.style.display = 'block';
                const contactHtml = event.contact_info.replace(/\n/g, '<br>');
                contactElement.innerHTML = `<p>${contactHtml}</p>`;
            } else {
                contactElement.parentElement.style.display = 'none';
            }
        }

    } catch (err) {
        console.error(err);
        document.getElementById('eventHero').innerHTML = `<div class="container text-center py-5"><h2>Error loading event.</h2></div>`;
    }
});
