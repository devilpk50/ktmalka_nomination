let pagesList = [];
let currentEditingSlug = null;
const authHeaders = {
    'Authorization': 'Basic ' + btoa('nomination:Ktm@lka26'),
    'Content-Type': 'application/json'
};

document.addEventListener('DOMContentLoaded', () => {
    loadPagesList();
});

async function loadPagesList() {
    try {
        const response = await fetch('/api/pages');
        if (response.ok) {
            pagesList = await response.json();
            renderPageList();
        } else {
            console.error('Failed to load pages list');
        }
    } catch (error) {
        console.error('Error fetching pages:', error);
    }
}

function renderPageList() {
    const listGroup = document.getElementById('pageList');
    listGroup.innerHTML = '';
    
    if (pagesList.length === 0) {
        listGroup.innerHTML = '<div class="list-group-item text-muted small">No pages found. Create one.</div>';
        return;
    }

    pagesList.forEach(page => {
        const a = document.createElement('a');
        a.href = '#';
        a.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
        if (currentEditingSlug === page.slug) {
            a.classList.add('active');
        }
        
        a.innerHTML = `
            <div>
                <strong>${page.title}</strong><br>
                <small class="text-${currentEditingSlug === page.slug ? 'white' : 'muted'}">/${page.slug}</small>
            </div>
        `;
        
        a.onclick = (e) => {
            e.preventDefault();
            loadPageDetails(page.slug);
            document.querySelectorAll('#pageList .list-group-item').forEach(el => el.classList.remove('active'));
            a.classList.add('active');
        };
        
        listGroup.appendChild(a);
    });
}

function newPage() {
    currentEditingSlug = null;
    document.getElementById('editorSection').style.display = 'block';
    document.getElementById('editorTitle').innerText = 'New Page';
    document.getElementById('pageTitle').value = '';
    document.getElementById('pageSlug').value = '';
    document.getElementById('pageSlug').disabled = false;
    document.getElementById('pageContent').value = '<div class="container py-5">\n  <h2>New Page</h2>\n  <p>Content goes here...</p>\n</div>';
    document.getElementById('deletePageBtn').style.display = 'none';
    
    document.querySelectorAll('#pageList .list-group-item').forEach(el => el.classList.remove('active'));
}

async function loadPageDetails(slug) {
    try {
        const response = await fetch(`/api/pages?slug=${slug}`);
        if (response.ok) {
            const page = await response.json();
            currentEditingSlug = page.slug;
            
            document.getElementById('editorSection').style.display = 'block';
            document.getElementById('editorTitle').innerText = 'Edit Page';
            document.getElementById('pageTitle').value = page.title;
            document.getElementById('pageSlug').value = page.slug;
            document.getElementById('pageSlug').disabled = true; // Don't allow changing slug of existing page easily
            document.getElementById('pageContent').value = page.html_content || '';
            document.getElementById('deletePageBtn').style.display = 'inline-block';
        }
    } catch (error) {
        console.error('Error loading page details:', error);
    }
}

async function savePage() {
    const title = document.getElementById('pageTitle').value.trim();
    const slug = document.getElementById('pageSlug').value.trim();
    const html_content = document.getElementById('pageContent').value;
    
    if (!title || !slug) {
        alert('Title and Slug are required.');
        return;
    }
    
    const method = currentEditingSlug ? 'PUT' : 'POST';
    const payload = { slug, title, html_content };
    
    try {
        const response = await fetch('/api/pages', {
            method: method,
            headers: authHeaders,
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            alert('Page saved successfully!');
            currentEditingSlug = slug;
            loadPagesList();
            document.getElementById('pageSlug').disabled = true;
            document.getElementById('deletePageBtn').style.display = 'inline-block';
            document.getElementById('editorTitle').innerText = 'Edit Page';
        } else {
            const err = await response.json();
            alert('Error: ' + (err.error || 'Failed to save page'));
        }
    } catch (error) {
        console.error('Error saving page:', error);
        alert('Error saving page');
    }
}

async function deletePage() {
    if (!currentEditingSlug) return;
    if (!confirm(`Are you sure you want to delete the page "${currentEditingSlug}"? This action cannot be undone.`)) return;
    
    try {
        const response = await fetch(`/api/pages?slug=${currentEditingSlug}`, {
            method: 'DELETE',
            headers: authHeaders
        });
        
        if (response.ok) {
            currentEditingSlug = null;
            document.getElementById('editorSection').style.display = 'none';
            loadPagesList();
        } else {
            const err = await response.json();
            alert('Error: ' + (err.error || 'Failed to delete page'));
        }
    } catch (error) {
        console.error('Error deleting page:', error);
        alert('Error deleting page');
    }
}
