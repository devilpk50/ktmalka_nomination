// API_BASE is defined in admin-common.js
let projects = [];

// Fetch projects from the API
async function fetchProjects() {
    try {
        const res = await fetch(`${API_BASE}/api/projects`, { credentials: 'include' });
        if (!res.ok) {
            if (res.status === 401) window.location.href = '/admin/login';
            throw new Error('Failed to fetch projects');
        }
        projects = await res.json();
        renderProjects();
    } catch (error) {
        console.error(error);
        alert('Could not load projects. Please try again.');
    }
}

// Render projects into the table
function renderProjects() {
    const tbody = document.querySelector('#projectsTable tbody');
    tbody.innerHTML = '';
    
    if (projects.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No projects found. Create one above!</td></tr>`;
        return;
    }
    
    projects.forEach(project => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                ${project.image_url ? `<img src="${project.image_url.startsWith('http') || project.image_url.startsWith('/') ? project.image_url : '/' + project.image_url}" alt="Img" style="height: 40px; width: 40px; object-fit: cover; border-radius: 4px;">` : '<div class="bg-secondary text-white d-flex align-items-center justify-content-center" style="height: 40px; width: 40px; border-radius: 4px;"><i class="bi bi-image"></i></div>'}
            </td>
            <td>
                <strong>${project.title}</strong>
                ${project.is_signature ? '<span class="badge bg-warning text-dark ms-2">Signature</span>' : ''}
            </td>
            <td>${project.date || '-'}</td>
            <td>${project.category || '-'}</td>
            <td><span class="badge ${project.status === 'Completed' ? 'bg-success' : project.status === 'Ongoing' ? 'bg-primary' : 'bg-secondary'}">${project.status || '-'}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-2 edit-btn" data-id="${project.id}"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${project.id}"><i class="bi bi-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Add event listeners for edit and delete buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const project = projects.find(p => p.id == id);
            if (project) openModal(project);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this project?')) {
                await deleteProject(id);
            }
        });
    });
}

const projectModal = new bootstrap.Modal(document.getElementById('projectModal'));

function openModal(project = null) {
    document.getElementById('projectForm').reset();
    document.getElementById('projectId').value = '';
    
    if (project) {
        document.getElementById('projectModalTitle').textContent = 'Edit Project';
        document.getElementById('projectId').value = project.id;
        document.getElementById('projectTitle').value = project.title;
        document.getElementById('projectDate').value = project.date || '';
        document.getElementById('projectCategory').value = project.category || '';
        document.getElementById('projectStatus').value = project.status || 'Completed';
        document.getElementById('projectImage').value = project.image_url || '';
        document.getElementById('projectImagePreview').src = project.image_url || '';
        document.getElementById('projectImagePreviewContainer').style.display = project.image_url ? 'block' : 'none';
        document.getElementById('projectDescription').value = project.description || '';
        document.getElementById('projectDetails').value = project.details || '';
        document.getElementById('projectObjectives').value = project.objectives || '';
        document.getElementById('projectIsSignature').checked = project.is_signature;
        document.getElementById('projectLocation').value = project.location || '';
        document.getElementById('projectDateFrom').value = project.date_from || '';
        document.getElementById('projectDateTo').value = project.date_to || '';
    } else {
        document.getElementById('projectModalTitle').textContent = 'Add New Project';
        document.getElementById('projectImagePreviewContainer').style.display = 'none';
        document.getElementById('projectImagePreview').src = '';
    }
    
    document.getElementById('projectImageFile').value = '';
    document.getElementById('projectImageStatus').style.display = 'none';
    
    projectModal.show();
}

document.getElementById('addProjectBtn').addEventListener('click', () => openModal());

function calculateDuration() {
    const fromStr = document.getElementById('projectDateFrom').value;
    const toStr = document.getElementById('projectDateTo').value;
    const durationInput = document.getElementById('projectDate');
    
    if (!fromStr || !toStr) {
        return;
    }
    
    const d1 = new Date(fromStr);
    const d2 = new Date(toStr);
    
    if (d2 < d1) {
        durationInput.value = 'Invalid Date Range';
        return;
    }
    
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        durationInput.value = '1 Day';
    } else if (diffDays < 30) {
        durationInput.value = `${diffDays + 1} Days`;
    } else {
        const months = Math.round(diffDays / 30);
        durationInput.value = `${months} Month${months > 1 ? 's' : ''}`;
    }
}

document.getElementById('projectDateFrom').addEventListener('change', calculateDuration);
document.getElementById('projectDateTo').addEventListener('change', calculateDuration);

document.getElementById('projectImageFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const statusEl = document.getElementById('projectImageStatus');
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
            document.getElementById('projectImage').value = data.url;
            document.getElementById('projectImagePreview').src = data.url;
            document.getElementById('projectImagePreviewContainer').style.display = 'block';
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

document.getElementById('saveProjectBtn').addEventListener('click', async () => {
    const id = document.getElementById('projectId').value;
    const title = document.getElementById('projectTitle').value.trim();
    
    if (!title) return alert('Title is required');
    
    const projectData = {
        title,
        date: document.getElementById('projectDate').value.trim(),
        category: document.getElementById('projectCategory').value.trim(),
        status: document.getElementById('projectStatus').value,
        image_url: document.getElementById('projectImage').value.trim(),
        description: document.getElementById('projectDescription').value.trim(),
        details: document.getElementById('projectDetails').value.trim(),
        objectives: document.getElementById('projectObjectives').value.trim(),
        is_signature: document.getElementById('projectIsSignature').checked,
        location: document.getElementById('projectLocation').value.trim(),
        date_from: document.getElementById('projectDateFrom').value,
        date_to: document.getElementById('projectDateTo').value
    };
    
    const method = id ? 'PUT' : 'POST';
    if (id) projectData.id = id;
    
    const btn = document.getElementById('saveProjectBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';
    
    try {
        const res = await fetch(`${API_BASE}/api/projects`, {
            method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(projectData)
        });
        
        const data = await res.json();
        if (res.ok && data.success) {
            projectModal.hide();
            await fetchProjects();
        } else {
            alert(data.error || 'Failed to save project');
        }
    } catch (err) {
        console.error(err);
        alert('Network error while saving');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Save Project';
    }
});

async function deleteProject(id) {
    try {
        const res = await fetch(`${API_BASE}/api/projects?id=${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const data = await res.json();
        if (res.ok && data.success) {
            await fetchProjects();
        } else {
            alert(data.error || 'Failed to delete project');
        }
    } catch (err) {
        console.error(err);
        alert('Network error while deleting');
    }
}

// Initial fetch
document.addEventListener('DOMContentLoaded', fetchProjects);
