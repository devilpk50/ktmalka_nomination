// API_BASE is defined in admin-common.js

let sliders = [];

// Fetch sliders from the API
async function fetchSliders() {
    try {
        const res = await fetch(`${API_BASE}/api/sliders`, { credentials: 'include' });
        if (!res.ok) {
            if (res.status === 401) window.location.href = '/admin/login';
            throw new Error('Failed to fetch sliders');
        }
        sliders = await res.json();
        renderSliders();
    } catch (error) {
        console.error(error);
        alert('Could not load sliders. Please try again.');
    }
}

// Render sliders into the table
function renderSliders() {
    const tbody = document.querySelector('#slidersTable tbody');
    tbody.innerHTML = '';
    
    if (sliders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No sliders found. Create one above!</td></tr>`;
        return;
    }
    
    sliders.forEach(slider => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <img src="${slider.image_url}" alt="Img" style="height: 50px; width: 80px; object-fit: cover; border-radius: 4px;">
            </td>
            <td><strong>${slider.title || '-'}</strong><br><small class="text-muted">${slider.tagline || ''}</small></td>
            <td>${slider.position_order}</td>
            <td><span class="badge ${slider.is_active ? 'bg-success' : 'bg-secondary'}">${slider.is_active ? 'Active' : 'Inactive'}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-2 edit-btn" data-id="${slider.id}"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${slider.id}"><i class="bi bi-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Add event listeners for edit and delete buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const slider = sliders.find(s => s.id == id);
            if (slider) openModal(slider);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this slider?')) {
                await deleteSlider(id);
            }
        });
    });
}

const sliderModal = new bootstrap.Modal(document.getElementById('sliderModal'));

function openModal(slider = null) {
    document.getElementById('sliderForm').reset();
    document.getElementById('sliderId').value = '';
    
    if (slider) {
        document.getElementById('sliderModalTitle').textContent = 'Edit Slider';
        document.getElementById('sliderId').value = slider.id;
        document.getElementById('sliderImage').value = slider.image_url || '';
        document.getElementById('sliderImagePreview').src = slider.image_url || '';
        document.getElementById('sliderImagePreviewContainer').style.display = slider.image_url ? 'block' : 'none';
        document.getElementById('sliderTitle').value = slider.title || '';
        document.getElementById('sliderTagline').value = slider.tagline || '';
        document.getElementById('sliderBtn1Text').value = slider.btn1_text || '';
        document.getElementById('sliderBtn1Url').value = slider.btn1_url || '';
        document.getElementById('sliderBtn2Text').value = slider.btn2_text || '';
        document.getElementById('sliderBtn2Url').value = slider.btn2_url || '';
        document.getElementById('sliderOrder').value = slider.position_order || 0;
        document.getElementById('sliderIsActive').checked = slider.is_active;
    } else {
        document.getElementById('sliderModalTitle').textContent = 'Add New Slider';
        document.getElementById('sliderOrder').value = 0;
        document.getElementById('sliderIsActive').checked = true;
        document.getElementById('sliderImagePreviewContainer').style.display = 'none';
        document.getElementById('sliderImagePreview').src = '';
    }
    
    document.getElementById('sliderImageFile').value = '';
    document.getElementById('sliderImageStatus').style.display = 'none';
    
    sliderModal.show();
}

document.getElementById('addSliderBtn').addEventListener('click', () => openModal());

document.getElementById('sliderImageFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const statusEl = document.getElementById('sliderImageStatus');
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
            document.getElementById('sliderImage').value = data.url;
            document.getElementById('sliderImagePreview').src = data.url;
            document.getElementById('sliderImagePreviewContainer').style.display = 'block';
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

document.getElementById('saveSliderBtn').addEventListener('click', async () => {
    const id = document.getElementById('sliderId').value;
    const image_url = document.getElementById('sliderImage').value.trim();
    
    if (!image_url) return alert('Image URL is required');
    
    const sliderData = {
        image_url,
        title: document.getElementById('sliderTitle').value.trim(),
        tagline: document.getElementById('sliderTagline').value.trim(),
        btn1_text: document.getElementById('sliderBtn1Text').value.trim(),
        btn1_url: document.getElementById('sliderBtn1Url').value.trim(),
        btn2_text: document.getElementById('sliderBtn2Text').value.trim(),
        btn2_url: document.getElementById('sliderBtn2Url').value.trim(),
        position_order: parseInt(document.getElementById('sliderOrder').value) || 0,
        is_active: document.getElementById('sliderIsActive').checked
    };
    
    const method = id ? 'PUT' : 'POST';
    if (id) sliderData.id = id;
    
    const btn = document.getElementById('saveSliderBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';
    
    try {
        const res = await fetch(`${API_BASE}/api/sliders`, {
            method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(sliderData)
        });
        
        const data = await res.json();
        if (res.ok && data.success) {
            sliderModal.hide();
            await fetchSliders();
        } else {
            alert(data.error || 'Failed to save slider');
        }
    } catch (err) {
        console.error(err);
        alert('Network error while saving');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Save Slider';
    }
});

async function deleteSlider(id) {
    try {
        const res = await fetch(`${API_BASE}/api/sliders?id=${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const data = await res.json();
        if (res.ok && data.success) {
            await fetchSliders();
        } else {
            alert(data.error || 'Failed to delete slider');
        }
    } catch (err) {
        console.error(err);
        alert('Network error while deleting');
    }
}

// Initial fetch
document.addEventListener('DOMContentLoaded', async () => {
    if (await requireAdmin()) {
        fetchSliders();
    }
});
