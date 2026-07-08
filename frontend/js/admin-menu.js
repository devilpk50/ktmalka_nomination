let menuItems = [];
const authHeaders = {
    'Authorization': 'Basic ' + btoa('nomination:Ktm@lka26'),
    'Content-Type': 'application/json'
};

document.addEventListener('DOMContentLoaded', () => {
    loadMenu();
});

async function loadMenu() {
    try {
        const response = await fetch('/api/menu');
        if (response.ok) {
            menuItems = await response.json();
            renderMenuTable();
        } else {
            console.error('Failed to load menu items');
        }
    } catch (error) {
        console.error('Error fetching menu items:', error);
    }
}

function renderMenuTable() {
    const tbody = document.getElementById('menuTableBody');
    tbody.innerHTML = '';
    
    if (menuItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">No menu items found. Click Add Menu Item to create one.</td></tr>';
        return;
    }

    menuItems.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.position_order}</td>
            <td><strong>${item.title}</strong></td>
            <td><code>${item.url}</code></td>
            <td>
                <span class="badge ${item.is_active ? 'bg-success' : 'bg-secondary'}">
                    ${item.is_active ? 'Active' : 'Hidden'}
                </span>
            </td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-primary" onclick='editMenu(${JSON.stringify(item).replace(/'/g, "&#39;")})'>Edit</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteMenu(${item.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openMenuModal() {
    document.getElementById('menuForm').reset();
    document.getElementById('menuId').value = '';
    document.getElementById('menuModalTitle').innerText = 'Add Menu Item';
}

function editMenu(item) {
    document.getElementById('menuId').value = item.id;
    document.getElementById('menuTitle').value = item.title;
    document.getElementById('menuUrl').value = item.url;
    document.getElementById('menuOrder').value = item.position_order;
    document.getElementById('menuActive').checked = item.is_active;
    
    document.getElementById('menuModalTitle').innerText = 'Edit Menu Item';
    const modal = new bootstrap.Modal(document.getElementById('menuModal'));
    modal.show();
}

async function saveMenu() {
    const id = document.getElementById('menuId').value;
    const title = document.getElementById('menuTitle').value.trim();
    const url = document.getElementById('menuUrl').value.trim();
    const order = parseInt(document.getElementById('menuOrder').value) || 0;
    const isActive = document.getElementById('menuActive').checked;
    
    if (!title || !url) {
        alert('Title and URL are required.');
        return;
    }
    
    const method = id ? 'PUT' : 'POST';
    const payload = { title, url, position_order: order, is_active: isActive };
    if (id) payload.id = parseInt(id);
    
    try {
        const response = await fetch('/api/menu', {
            method: method,
            headers: authHeaders,
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('menuModal')).hide();
            loadMenu();
        } else {
            const err = await response.json();
            alert('Error: ' + (err.error || 'Failed to save menu'));
        }
    } catch (error) {
        console.error('Error saving menu:', error);
        alert('Error saving menu');
    }
}

async function deleteMenu(id) {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    
    try {
        const response = await fetch(`/api/menu?id=${id}`, {
            method: 'DELETE',
            headers: authHeaders
        });
        
        if (response.ok) {
            loadMenu();
        } else {
            const err = await response.json();
            alert('Error: ' + (err.error || 'Failed to delete menu'));
        }
    } catch (error) {
        console.error('Error deleting menu:', error);
        alert('Error deleting menu');
    }
}
