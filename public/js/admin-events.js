// API_BASE is defined in admin-common.js

let events = [];

// Fetch events from the API
async function fetchEvents() {
    try {
        const res = await fetch(`${API_BASE}/api/events`, { credentials: 'include' });
        if (!res.ok) {
            if (res.status === 401) window.location.href = '/admin/login';
            throw new Error('Failed to fetch events');
        }
        events = await res.json();
        renderEvents();
    } catch (error) {
        console.error(error);
        alert('Could not load events. Please try again.');
    }
}

// Render events into the table
function renderEvents() {
    const tbody = document.querySelector('#eventsTable tbody');
    tbody.innerHTML = '';
    
    if (events.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No events found. Create one above!</td></tr>`;
        return;
    }
    
    events.forEach(evt => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                ${evt.image_url ? `<img src="${evt.image_url.startsWith('http') || evt.image_url.startsWith('/') ? evt.image_url : '/' + evt.image_url}" alt="Img" style="height: 40px; width: 40px; object-fit: cover; border-radius: 4px;">` : '<div class="bg-secondary text-white d-flex align-items-center justify-content-center" style="height: 40px; width: 40px; border-radius: 4px;"><i class="bi bi-image"></i></div>'}
            </td>
            <td><strong>${evt.title}</strong></td>
            <td>${evt.date || '-'}</td>
            <td>${evt.location || '-'}</td>
            <td><span class="badge ${evt.status === 'Upcoming' ? 'bg-primary' : evt.status === 'Past Event' ? 'bg-secondary' : 'bg-success'}">${evt.status || '-'}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-2 edit-btn" data-id="${evt.id}"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${evt.id}"><i class="bi bi-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Add event listeners for edit and delete buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const evt = events.find(p => p.id == id);
            if (evt) openModal(evt);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this event?')) {
                await deleteEvent(id);
            }
        });
    });
}

const eventModal = new bootstrap.Modal(document.getElementById('eventModal'));

function convert24to12(time24) {
    if (!time24) return '';
    let [hours, minutes] = time24.split(':');
    hours = parseInt(hours, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutes} ${ampm}`;
}

function convert12to24(time12) {
    if (!time12) return '';
    const match = time12.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return '';
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

function openModal(evt = null) {
    document.getElementById('eventForm').reset();
    document.getElementById('eventId').value = '';
    
    if (evt) {
        document.getElementById('eventModalTitle').textContent = 'Edit Event';
        document.getElementById('eventId').value = evt.id;
        document.getElementById('eventTitle').value = evt.title;
        document.getElementById('eventDate').value = evt.date || '';
        document.getElementById('eventLocation').value = evt.location || '';
        document.getElementById('eventStatus').value = evt.status || 'Upcoming';
        document.getElementById('eventImage').value = evt.image_url || '';
        document.getElementById('eventImagePreview').src = evt.image_url || '';
        document.getElementById('eventImagePreviewContainer').style.display = evt.image_url ? 'block' : 'none';
        document.getElementById('eventDescription').value = evt.description || '';
        
        // Handle time parsing
        let startTime = '', endTime = '';
        if (evt.time) {
            const parts = evt.time.split(' - ');
            startTime = convert12to24(parts[0]);
            if (parts.length > 1) endTime = convert12to24(parts[1]);
        }
        document.getElementById('eventStartTime').value = startTime;
        document.getElementById('eventEndTime').value = endTime;
        document.getElementById('eventTime').value = evt.time || '';
        document.getElementById('eventCategory').value = evt.category || '';
        document.getElementById('eventDetails').value = evt.details || '';
        document.getElementById('eventObjectives').value = evt.objectives || '';
        document.getElementById('eventContact').value = evt.contact_info || '';
    } else {
        document.getElementById('eventModalTitle').textContent = 'Add New Event';
        document.getElementById('eventImagePreviewContainer').style.display = 'none';
        document.getElementById('eventImagePreview').src = '';
    }
    
    document.getElementById('eventImageFile').value = '';
    document.getElementById('eventImageStatus').style.display = 'none';
    
    eventModal.show();
}

document.getElementById('addEventBtn').addEventListener('click', () => openModal());

document.getElementById('eventImageFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const statusEl = document.getElementById('eventImageStatus');
    statusEl.style.display = 'inline-block';
    statusEl.textContent = 'Uploading...';
    statusEl.className = 'badge bg-warning text-dark mb-2';

    try {
        const uniqueFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const response = await fetch(`${API_BASE}/api/upload-server?filename=${encodeURIComponent(uniqueFilename)}`, {
            method: 'POST',
            body: file,
            headers: {
                'Content-Type': file.type || 'application/octet-stream'
            }
        });
        
        const data = await response.json();
        
        if (response.ok && data.url) {
            document.getElementById('eventImage').value = data.url;
            document.getElementById('eventImagePreview').src = data.url;
            document.getElementById('eventImagePreviewContainer').style.display = 'block';
            statusEl.textContent = 'Uploaded successfully!';
            statusEl.className = 'badge bg-success mb-2';
        } else {
            throw new Error(data.error || 'Upload failed');
        }
    } catch (err) {
        console.error(err);
        statusEl.textContent = 'Upload failed';
        statusEl.className = 'badge bg-danger mb-2';
        alert('Failed to upload image. Please try again.');
    }
});

document.getElementById('saveEventBtn').addEventListener('click', async () => {
    const id = document.getElementById('eventId').value;
    const title = document.getElementById('eventTitle').value.trim();
    
    if (!title) return alert('Title is required');
    
    // Combine start and end time
    const startTimeStr = document.getElementById('eventStartTime').value;
    const endTimeStr = document.getElementById('eventEndTime').value;
    let combinedTime = '';
    if (startTimeStr) {
        combinedTime = convert24to12(startTimeStr);
        if (endTimeStr) {
            combinedTime += ' - ' + convert24to12(endTimeStr);
        }
    }
    document.getElementById('eventTime').value = combinedTime;
    
    const eventData = {
        title,
        date: document.getElementById('eventDate').value.trim(),
        location: document.getElementById('eventLocation').value.trim(),
        status: document.getElementById('eventStatus').value,
        image_url: document.getElementById('eventImage').value.trim(),
        description: document.getElementById('eventDescription').value.trim(),
        time: document.getElementById('eventTime').value.trim(),
        category: document.getElementById('eventCategory').value.trim(),
        details: document.getElementById('eventDetails').value.trim(),
        objectives: document.getElementById('eventObjectives').value.trim(),
        contact_info: document.getElementById('eventContact').value.trim()
    };
    
    const method = id ? 'PUT' : 'POST';
    if (id) eventData.id = id;
    
    const btn = document.getElementById('saveEventBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';
    
    try {
        const res = await fetch(`${API_BASE}/api/events`, {
            method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(eventData)
        });
        
        const data = await res.json();
        if (res.ok && data.success) {
            eventModal.hide();
            await fetchEvents();
        } else {
            alert(data.error || 'Failed to save event');
        }
    } catch (err) {
        console.error(err);
        alert('Network error while saving');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Save Event';
    }
});

async function deleteEvent(id) {
    try {
        const res = await fetch(`${API_BASE}/api/events?id=${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const data = await res.json();
        if (res.ok && data.success) {
            await fetchEvents();
        } else {
            alert(data.error || 'Failed to delete event');
        }
    } catch (err) {
        console.error(err);
        alert('Network error while deleting');
    }
}

// Initial fetch
document.addEventListener('DOMContentLoaded', async () => {
    if (await requireAdmin()) {
        fetchEvents();
    }
});
