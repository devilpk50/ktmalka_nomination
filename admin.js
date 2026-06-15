document.addEventListener('DOMContentLoaded', () => {
    // Auth UI Elements
    const loginContainer = document.getElementById('loginContainer');
    const dashboardContainer = document.querySelector('.dashboard-container');
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');
    const loginErrorMsg = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');

    // Admin Credentials
    const ADMIN_USER = 'nomination';
    const ADMIN_PASS = 'Ktm@lka26';

    function getAuthHeaders() {
        const username = ADMIN_USER;
        const password = ADMIN_PASS;
        const base64 = btoa(`${username}:${password}`);
        return {
            'Authorization': `Basic ${base64}`,
            'Content-Type': 'application/json'
        };
    }

    // Deadline Settings Elements
    const deadlineInput = document.getElementById('deadlineInput');
    const tenureInput = document.getElementById('tenureInput');
    const saveDeadlineBtn = document.getElementById('saveDeadlineBtn');

    function updateTenureDisplays() {
        const savedTenure = localStorage.getItem('leoNominationTenure') || 'L.Y. 2025/26';
        
        // Update document title if present
        if (document.title.includes('Admin Dashboard')) {
            document.title = `Admin Dashboard | Leo Club Nominations | ${savedTenure}`;
        }
        
        // Update elements with class 'tenureText'
        document.querySelectorAll('.tenureText').forEach(el => {
            el.textContent = savedTenure;
        });
    }

    // Call immediately on load
    updateTenureDisplays();

    async function initDeadlineSettings() {
        if (!deadlineInput) return;
        
        try {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const settings = await res.json();
                if (settings.leoNominationDeadline) {
                    localStorage.setItem('leoNominationDeadline', settings.leoNominationDeadline);
                }
                if (settings.leoNominationTenure) {
                    localStorage.setItem('leoNominationTenure', settings.leoNominationTenure);
                }
            }
        } catch (err) {
            console.error('Failed to fetch settings from database:', err);
        }
        
        let deadline = localStorage.getItem('leoNominationDeadline') || '2026-06-17T23:59';
        deadlineInput.value = deadline;

        let tenure = localStorage.getItem('leoNominationTenure') || 'L.Y. 2025/26';
        if (tenureInput) {
            tenureInput.value = tenure;
        }

        // Apply initially
        updateTenureDisplays();

        if (saveDeadlineBtn) {
            // Remove previous event listener just in case to prevent double binding
            const newSaveBtn = saveDeadlineBtn.cloneNode(true);
            saveDeadlineBtn.parentNode.replaceChild(newSaveBtn, saveDeadlineBtn);
            
            newSaveBtn.addEventListener('click', async () => {
                const newDeadline = deadlineInput.value;
                if (!newDeadline) {
                    showAdminToast('Please select a valid date and time.', false);
                    return;
                }
                const newTenure = tenureInput ? tenureInput.value.trim() : '';
                if (!newTenure) {
                    showAdminToast('Please enter a valid tenure/L.Y. string.', false);
                    return;
                }
                
                try {
                    const res = await fetch('/api/settings', {
                        method: 'POST',
                        headers: getAuthHeaders(),
                        body: JSON.stringify({ deadline: newDeadline, tenure: newTenure })
                    });
                    if (res.ok) {
                        localStorage.setItem('leoNominationDeadline', newDeadline);
                        localStorage.setItem('leoNominationTenure', newTenure);
                        updateTenureDisplays();
                        showAdminToast('✓ Nomination settings saved successfully!');
                    } else {
                        showAdminToast('Failed to save settings to server.', false);
                    }
                } catch (err) {
                    console.error('Failed to save settings:', err);
                    showAdminToast('Connection error. Failed to save settings.', false);
                }
            });
        }
    }

    function initCsvUploader() {
        const memberCsvInput = document.getElementById('memberCsvInput');
        const uploadCsvBtn = document.getElementById('uploadCsvBtn');
        const resetCsvBtn = document.getElementById('resetCsvBtn');
        const csvStatusMsg = document.getElementById('csvStatusMsg');

        if (!uploadCsvBtn || !memberCsvInput) return;

        function updateCsvStatus() {
            if (!csvStatusMsg) return;
            const localData = localStorage.getItem('leoMemberData');
            if (localData) {
                try {
                    const parsed = JSON.parse(localData);
                    const count = Object.keys(parsed).length;
                    csvStatusMsg.innerHTML = `<span style="color:#2ecc71; font-weight: 600;">✓ Active: Custom List (${count} members)</span>`;
                } catch (e) {
                    csvStatusMsg.innerHTML = `<span style="color:#e74c3c;">Error loading custom list</span>`;
                }
            } else {
                const count = typeof memberData !== 'undefined' ? Object.keys(memberData).length : 0;
                csvStatusMsg.innerHTML = `<span style="color:#94a3b8;">Active: Default List (${count} members)</span>`;
            }
        }

        // Initialize status display
        updateCsvStatus();

        uploadCsvBtn.addEventListener('click', () => {
            memberCsvInput.click();
        });

        memberCsvInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(evt) {
                const text = evt.target.result;
                parseAndSaveMemberCsv(text);
            };
            reader.readAsText(file);
            memberCsvInput.value = ''; // Reset input selection
        });

        if (resetCsvBtn) {
            resetCsvBtn.addEventListener('click', () => {
                showConfirm(
                    'Reset Member Database',
                    'Are you sure you want to reset the member list to default? Any uploaded custom CSV list will be deleted.',
                    async () => {
                        try {
                            const res = await fetch('/api/setup?key=initialize');
                            if (res.ok) {
                                showAdminToast('✓ Member list database reset to default.');
                                updateCsvStatus();
                                setTimeout(() => {
                                    location.reload();
                                }, 1000);
                            } else {
                                showAdminToast('Failed to reset member list database.', false);
                            }
                        } catch (err) {
                            console.error(err);
                            showAdminToast('Connection error. Failed to reset database.', false);
                        }
                    }
                );
            });
        }

        function parseAndSaveMemberCsv(csvText) {
            try {
                const lines = csvText.split(/\r?\n/);
                if (lines.length < 2) {
                    showAdminToast('CSV file is empty or invalid.', false);
                    return;
                }

                // Parse header to find column indices
                const headers = parseCSVLine(lines[0]);
                const leoIdIdx = headers.findIndex(h => h.toLowerCase().replace(/['\s]/g, '') === 'leoid');
                const nameIdx = headers.findIndex(h => h.toLowerCase().replace(/['\s]/g, '') === 'leosname' || h.toLowerCase().replace(/['\s]/g, '') === 'name');
                const posIdx = headers.findIndex(h => h.toLowerCase().replace(/['\s]/g, '') === 'position');
                const emailIdx = headers.findIndex(h => h.toLowerCase().replace(/['\s]/g, '') === 'emailaddress' || h.toLowerCase().replace(/['\s]/g, '') === 'email');
                const duesIdx = headers.findIndex(h => h.toLowerCase().replace(/['\s]/g, '') === 'duespayment' || h.toLowerCase().replace(/['\s]/g, '') === 'duespaid' || h.toLowerCase().replace(/['\s]/g, '') === 'dues');

                if (leoIdIdx === -1 || nameIdx === -1 || posIdx === -1) {
                    showAdminToast('CSV requires "Leo ID", "Leo\'s Name" (or "Name"), and "Position" columns.', false);
                    return;
                }

                const newMemberData = {};

                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    const cols = parseCSVLine(line);
                    if (cols.length < Math.max(leoIdIdx, nameIdx, posIdx) + 1) continue;

                    const leoId = cols[leoIdIdx].trim();
                    if (!leoId) continue;

                    const name = cols[nameIdx].trim();
                    const position = cols[posIdx].trim();
                    const email = emailIdx !== -1 && cols[emailIdx] ? cols[emailIdx].trim() : '';
                    
                    let duesPaid = false;
                    if (duesIdx !== -1 && cols[duesIdx]) {
                        const duesVal = cols[duesIdx].trim().toLowerCase();
                        duesPaid = duesVal === 'true' || duesVal === 'yes' || duesVal === '1' || duesVal === 'paid';
                    }

                    newMemberData[leoId] = { name, position, email, duesPaid };
                }

                if (Object.keys(newMemberData).length === 0) {
                    showAdminToast('No valid member records found in the CSV.', false);
                    return;
                }

                const membersArray = [];
                for (const leoId in newMemberData) {
                    membersArray.push({
                        leoId,
                        name: newMemberData[leoId].name,
                        position: newMemberData[leoId].position,
                        email: newMemberData[leoId].email,
                        duesPaid: newMemberData[leoId].duesPaid
                    });
                }

                // POST array to server API
                fetch('/api/members', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(membersArray)
                })
                .then(res => {
                    if (res.ok) {
                        showAdminToast(`✓ Successfully imported ${membersArray.length} member records!`);
                        updateCsvStatus();
                        setTimeout(() => {
                            location.reload();
                        }, 1000);
                    } else {
                        showAdminToast('Failed to import members to database.', false);
                    }
                })
                .catch(err => {
                    console.error('Import error:', err);
                    showAdminToast('Connection error. Import failed.', false);
                });

            } catch (err) {
                console.error('Error parsing member CSV:', err);
                showAdminToast('Failed to parse CSV file formatting.', false);
            }
        }

        function parseCSVLine(line) {
            const result = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    result.push(current);
                    current = '';
                } else {
                    current += char;
                }
            }
            result.push(current);
            return result;
        }
    }

    function initMembersManager() {
        const membersTableBody = document.querySelector('#membersTable tbody');
        const memberSearchInput = document.getElementById('memberSearchInput');
        const addMemberBtn = document.getElementById('addMemberBtn');
        const memberCrudModal = document.getElementById('memberCrudModal');
        const closeMemberCrudBtn = document.getElementById('closeMemberCrudBtn');
        const cancelCrudBtn = document.getElementById('cancelCrudBtn');
        const memberCrudForm = document.getElementById('memberCrudForm');
        
        const crudAction = document.getElementById('crudAction');
        const originalLeoIdInput = document.getElementById('originalLeoId');
        const crudLeoId = document.getElementById('crudLeoId');
        const crudName = document.getElementById('crudName');
        const crudPosition = document.getElementById('crudPosition');
        const crudEmail = document.getElementById('crudEmail');
        const crudContact = document.getElementById('crudContact');
        const crudDuesPaid = document.getElementById('crudDuesPaid');
        const memberCrudModalTitle = document.getElementById('memberCrudModalTitle');

        if (!membersTableBody) return;

        let currentMembers = {};

        async function loadMembers() {
            try {
                const res = await fetch('/api/members');
                if (res.ok) {
                    currentMembers = await res.json();
                }
            } catch (err) {
                console.error('Failed to parse members from backend API:', err);
            }
            renderMembersTable();
        }

        function saveMembers() {
            try {
                localStorage.setItem('leoMemberData', JSON.stringify(currentMembers));
            } catch (err) {
                console.error('Failed to save members to localStorage:', err);
            }
            
            // Sync with global memberData so other scripts/actions use the updated list immediately
            if (typeof memberData !== 'undefined') {
                try {
                    for (const key in memberData) {
                        if (memberData.hasOwnProperty(key)) {
                            delete memberData[key];
                        }
                    }
                    Object.assign(memberData, currentMembers);
                } catch (e) {
                    console.warn('Failed to sync global memberData in-memory:', e);
                }
            }
            
            // Trigger update status of CSV Uploader if visible
            const csvStatusMsg = document.getElementById('csvStatusMsg');
            if (csvStatusMsg) {
                const count = Object.keys(currentMembers).length;
                csvStatusMsg.innerHTML = `<span style="color:#2ecc71; font-weight: 600;">✓ Active: Custom List (${count} members)</span>`;
            }
        }

        function renderMembersTable() {
            membersTableBody.innerHTML = '';
            const query = memberSearchInput ? memberSearchInput.value.toLowerCase().trim() : '';

            const keys = Object.keys(currentMembers);
            let matchCount = 0;

            keys.forEach(id => {
                const member = currentMembers[id];
                const matches = id.toLowerCase().includes(query) || 
                                (member.name && member.name.toLowerCase().includes(query)) || 
                                (member.position && member.position.toLowerCase().includes(query)) ||
                                (member.email && member.email.toLowerCase().includes(query)) ||
                                (member.contact && member.contact.toLowerCase().includes(query));

                if (!matches) return;
                matchCount++;

                const tr = document.createElement('tr');
                
                const duesBadge = member.duesPaid 
                    ? `<span class="status-badge approved">Paid</span>` 
                    : `<span class="status-badge rejected">Unpaid</span>`;

                tr.innerHTML = `
                    <td><code>${id}</code></td>
                    <td><strong>${member.name}</strong></td>
                    <td>${member.position}</td>
                    <td>${member.email || '<span style="color:#94a3b8">N/A</span>'}</td>
                    <td>${member.contact || '<span style="color:#94a3b8">N/A</span>'}</td>
                    <td>${duesBadge}</td>
                `;

                // Actions cell
                const tdActions = document.createElement('td');
                tdActions.className = 'actions-cell';

                const btnEdit = document.createElement('button');
                btnEdit.className = 'btn-action btn-edit';
                btnEdit.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    Edit
                `;
                btnEdit.addEventListener('click', () => {
                    openCrudModal('edit', id);
                });
                tdActions.appendChild(btnEdit);

                const btnDelete = document.createElement('button');
                btnDelete.className = 'btn-action btn-delete';
                btnDelete.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    Delete
                `;
                btnDelete.addEventListener('click', () => {
                    const mName = currentMembers[id]?.name || id;
                    showConfirm(
                        'Delete Member',
                        `Are you sure you want to delete member "${mName}" (ID: ${id})?`,
                        async () => {
                            try {
                                const res = await fetch(`/api/members?id=${id}`, {
                                    method: 'DELETE',
                                    headers: getAuthHeaders()
                                });
                                if (res.ok) {
                                    delete currentMembers[id];
                                    renderMembersTable();
                                    showAdminToast(`✓ Deleted member "${mName}"`);
                                } else {
                                    showAdminToast('Failed to delete member on server.', false);
                                }
                            } catch (err) {
                                console.error('Error deleting member:', err);
                                showAdminToast('Connection error. Failed to delete member.', false);
                            }
                        }
                    );
                });
                tdActions.appendChild(btnDelete);

                tr.appendChild(tdActions);
                membersTableBody.appendChild(tr);
            });

            if (matchCount === 0) {
                membersTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#64748b;">No members found.</td></tr>`;
            }
        }

        function openCrudModal(action, id = '') {
            crudAction.value = action;
            if (action === 'create') {
                memberCrudModalTitle.textContent = 'Add New Member';
                crudLeoId.value = '';
                crudLeoId.disabled = false;
                crudName.value = '';
                crudPosition.value = '';
                crudEmail.value = '';
                crudContact.value = '';
                crudDuesPaid.checked = false;
                originalLeoIdInput.value = '';
            } else if (action === 'edit' && id) {
                const member = currentMembers[id];
                memberCrudModalTitle.textContent = `Edit Member: ${member.name}`;
                crudLeoId.value = id;
                crudLeoId.disabled = false;
                originalLeoIdInput.value = id;
                crudName.value = member.name.replace(/^Leo\s+/i, '') || '';
                crudPosition.value = member.position || '';
                crudEmail.value = member.email || '';
                crudContact.value = member.contact || '';
                crudDuesPaid.checked = !!member.duesPaid;
            }
            memberCrudModal.style.display = 'block';
        }

        function closeCrudModal() {
            memberCrudModal.style.display = 'none';
        }

        // Initialize state
        loadMembers();
        renderMembersTable();

        // Attach listeners
        if (memberSearchInput) {
            memberSearchInput.addEventListener('input', renderMembersTable);
        }

        if (addMemberBtn) {
            addMemberBtn.addEventListener('click', () => openCrudModal('create'));
        }

        [closeMemberCrudBtn, cancelCrudBtn].forEach(btn => {
            if (btn) btn.addEventListener('click', closeCrudModal);
        });

        // Close on outside click
        window.addEventListener('click', (e) => {
            if (e.target === memberCrudModal) {
                closeCrudModal();
            }
        });

        if (memberCrudForm) {
            memberCrudForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const action = crudAction.value;
                const origId = originalLeoIdInput.value;
                const newId = crudLeoId.value.trim();
                const name = crudName.value.trim();
                const position = crudPosition.value.trim();
                const email = crudEmail.value.trim();
                const contact = crudContact.value.trim();
                const duesPaid = crudDuesPaid.checked;

                if (!newId || !name || !position) {
                    showAdminToast('Please fill in Leo ID, Name, and Position.', false);
                    return;
                }

                // Check Leo ID uniqueness
                if (action === 'create' && currentMembers[newId]) {
                    showAdminToast(`Member with Leo ID ${newId} already exists.`, false);
                    return;
                }
                if (action === 'edit' && origId !== newId && currentMembers[newId]) {
                    showAdminToast(`Member with Leo ID ${newId} already exists.`, false);
                    return;
                }

                // Form name prefix formatting
                let formattedName = name;
                if (!formattedName.toLowerCase().startsWith('leo')) {
                    formattedName = 'Leo ' + formattedName;
                }

                const memberPayload = {
                    originalLeoId: origId,
                    newLeoId: newId,
                    leoId: newId,
                    name: formattedName,
                    position: position,
                    email: email,
                    contact: contact,
                    duesPaid: duesPaid
                };

                try {
                    const url = '/api/members';
                    const method = action === 'create' ? 'POST' : 'PUT';
                    const res = await fetch(url, {
                        method: method,
                        headers: getAuthHeaders(),
                        body: JSON.stringify(memberPayload)
                    });

                    if (res.ok) {
                        if (action === 'edit' && origId !== newId) {
                            delete currentMembers[origId];
                        }
                        currentMembers[newId] = {
                            name: formattedName,
                            position: position,
                            email: email,
                            contact: contact,
                            duesPaid: duesPaid
                        };
                        closeCrudModal();
                        renderMembersTable();
                        showAdminToast(action === 'create' ? `✓ Successfully added member "${formattedName}"!` : `✓ Successfully updated member "${formattedName}"!`);
                    } else {
                        const err = await res.json();
                        showAdminToast(err.error || 'Failed to save member on server.', false);
                    }
                } catch (err) {
                    console.error('Error saving member:', err);
                    showAdminToast('Connection error. Failed to save member.', false);
                }
            });
        }
    }

    function checkAuth() {
        const isLoggedIn = sessionStorage.getItem('leo_admin_logged_in') === 'true';
        if (isLoggedIn) {
            if (loginContainer) loginContainer.style.display = 'none';
            if (dashboardContainer) dashboardContainer.classList.remove('auth-hidden');
            
            // Set dynamic user name to the logged in Admin display name
            const usernameEl = document.getElementById('adminUsername');
            if (usernameEl) {
                usernameEl.textContent = 'Nomination Chairperson';
            }
            
            loadData();
            initDeadlineSettings();
            initCsvUploader();
            initMembersManager();
            switchTab('overview');
        } else {
            if (loginContainer) loginContainer.style.display = 'flex';
            if (dashboardContainer) dashboardContainer.classList.add('auth-hidden');
        }
    }

    // Toggle Password Visibility
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', () => {
            const isPassword = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
            togglePasswordBtn.classList.toggle('active', isPassword);
            
            if (isPassword) {
                togglePasswordBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
            } else {
                togglePasswordBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
            }
        });
    }

    // Handle Login Form Submission
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = usernameInput.value.trim();
            const password = passwordInput.value;

            if (username === ADMIN_USER && password === ADMIN_PASS) {
                sessionStorage.setItem('leo_admin_logged_in', 'true');
                loginErrorMsg.classList.add('hidden');
                usernameInput.value = '';
                passwordInput.value = '';
                checkAuth();
            } else {
                loginErrorMsg.classList.remove('hidden');
                loginErrorMsg.textContent = 'Invalid username or password.';
                
                const card = document.querySelector('.login-card');
                if (card) {
                    card.style.animation = 'none';
                    void card.offsetWidth; // force reflow
                    card.style.animation = 'shake 0.4s ease-in-out';
                }
            }
        });
    }

    // Handle Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showConfirm(
                'Confirm Logout',
                'Are you sure you want to log out?',
                () => {
                    sessionStorage.removeItem('leo_admin_logged_in');
                    checkAuth();
                },
                'Logout'
            );
        });
    }

    // Tab switching elements & logic
    const tabBtnOverview = document.getElementById('tabBtnOverview');
    const tabBtnFormSettings = document.getElementById('tabBtnFormSettings');
    const tabBtnMembers = document.getElementById('tabBtnMembers');
    const overviewTab = document.getElementById('overviewTab');
    const formSettingsTab = document.getElementById('formSettingsTab');
    const membersTab = document.getElementById('membersTab');
    const submenu = document.querySelector('.submenu');

    function switchTab(tabId) {
        if (tabId === 'overview') {
            if (tabBtnOverview) tabBtnOverview.classList.add('active');
            if (tabBtnFormSettings) tabBtnFormSettings.classList.remove('active');
            if (tabBtnMembers) tabBtnMembers.classList.remove('active');
            if (overviewTab) overviewTab.classList.remove('hidden');
            if (formSettingsTab) formSettingsTab.classList.add('hidden');
            if (membersTab) membersTab.classList.add('hidden');
            if (submenu) submenu.classList.add('hidden');
        } else if (tabId === 'form-settings') {
            if (tabBtnOverview) tabBtnOverview.classList.remove('active');
            if (tabBtnFormSettings) tabBtnFormSettings.classList.add('active');
            if (tabBtnMembers) tabBtnMembers.classList.remove('active');
            if (overviewTab) overviewTab.classList.add('hidden');
            if (formSettingsTab) formSettingsTab.classList.remove('hidden');
            if (membersTab) membersTab.classList.add('hidden');
            if (submenu) submenu.classList.remove('hidden');
        } else if (tabId === 'members') {
            if (tabBtnOverview) tabBtnOverview.classList.remove('active');
            if (tabBtnFormSettings) tabBtnFormSettings.classList.remove('active');
            if (tabBtnMembers) tabBtnMembers.classList.add('active');
            if (overviewTab) overviewTab.classList.add('hidden');
            if (formSettingsTab) formSettingsTab.classList.add('hidden');
            if (membersTab) membersTab.classList.remove('hidden');
            if (submenu) submenu.classList.add('hidden');
        }
    }

    // Sub-tab switching elements & logic
    const subBtnEdit = document.getElementById('subBtnEdit');
    const subBtnSubmission = document.getElementById('subBtnSubmission');
    const subBtnSpecifications = document.getElementById('subBtnSpecifications');

    const subTabEdit = document.getElementById('subTabEdit');
    const subTabSubmission = document.getElementById('subTabSubmission');
    const subTabSpecifications = document.getElementById('subTabSpecifications');

    function switchSubTab(subTabId) {
        // Hide all sub-tabs
        [subTabEdit, subTabSubmission, subTabSpecifications].forEach(tab => {
            if (tab) tab.classList.add('hidden');
        });
        // Remove active class from all sub-buttons
        [subBtnEdit, subBtnSubmission, subBtnSpecifications].forEach(btn => {
            if (btn) btn.classList.remove('active-sub');
        });

        // Activate selected
        if (subTabId === 'edit') {
            if (subTabEdit) subTabEdit.classList.remove('hidden');
            if (subBtnEdit) subBtnEdit.classList.add('active-sub');
        } else if (subTabId === 'submission') {
            if (subTabSubmission) subTabSubmission.classList.remove('hidden');
            if (subBtnSubmission) subBtnSubmission.classList.add('active-sub');
        } else if (subTabId === 'specifications') {
            if (subTabSpecifications) subTabSpecifications.classList.remove('hidden');
            if (subBtnSpecifications) subBtnSpecifications.classList.add('active-sub');
        }
    }

    if (tabBtnOverview) {
        tabBtnOverview.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab('overview');
        });
    }

    if (tabBtnFormSettings) {
        tabBtnFormSettings.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab('form-settings');
            // Default to 'edit' sub-tab if none is active
            const hasActiveSub = [subBtnEdit, subBtnSubmission, subBtnSpecifications].some(btn => btn && btn.classList.contains('active-sub'));
            if (!hasActiveSub) {
                switchSubTab('edit');
            }
        });
    }

    if (tabBtnMembers) {
        tabBtnMembers.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab('members');
        });
    }

    if (subBtnEdit) {
        subBtnEdit.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            switchTab('form-settings');
            switchSubTab('edit');
        });
    }

    if (subBtnSubmission) {
        subBtnSubmission.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            switchTab('form-settings');
            switchSubTab('submission');
        });
    }

    if (subBtnSpecifications) {
        subBtnSpecifications.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            switchTab('form-settings');
            switchSubTab('specifications');
        });
    }

    // Initialize EmailJS (users should replace with their own Public Key)
    if (typeof emailjs !== 'undefined') {
        emailjs.init({
            publicKey: "YOUR_PUBLIC_KEY_HERE",
        });
    }

    const tableBody = document.querySelector('#nominationsTable tbody');
    const totalAppsEl = document.getElementById('totalApps');
    const presidentAppsEl = document.getElementById('presidentApps');
    const vpAppsEl = document.getElementById('vpApps');
    const otherAppsEl = document.getElementById('otherApps');
    const clearDataBtn = document.getElementById('clearDataBtn');
    
    // Filters and export elements
    const searchInput = document.getElementById('searchInput');
    const positionFilter = document.getElementById('positionFilter');
    const statusFilter = document.getElementById('statusFilter');
    const exportCsvBtn = document.getElementById('exportCsvBtn');

    // Details Modal elements
    const detailsModal = document.getElementById('detailsModal');
    const closeDetailsBtn = document.getElementById('closeDetailsBtn');
    const closeDetailsModalBtn = document.getElementById('closeDetailsModalBtn');
    const modalDetailsContent = document.getElementById('modalDetailsContent');

    let submissions = [];

    async function loadData() {
        try {
            const res = await fetch('/api/nominations', {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                submissions = await res.json();
            } else {
                showAdminToast('Failed to load nominations from server database.', false);
            }
        } catch (err) {
            console.error('Failed to load nominations:', err);
            showAdminToast('Failed to connect to backend api.', false);
            submissions = JSON.parse(localStorage.getItem('leoNominations') || '[]');
        }
        updateStats();
        renderTable();
    }

    function updateStats() {
        totalAppsEl.textContent = submissions.length;
        presidentAppsEl.textContent = submissions.filter(s => s.positionValue === 'president').length;
        vpAppsEl.textContent = submissions.filter(s => s.positionValue === 'vice_president').length;
        otherAppsEl.textContent = submissions.length - parseInt(presidentAppsEl.textContent) - parseInt(vpAppsEl.textContent);
    }

    function renderTable() {
        tableBody.innerHTML = '';

        const searchQuery = searchInput.value.toLowerCase().trim();
        const selectedPos = positionFilter.value;
        const selectedStatus = statusFilter.value;

        // Filter submissions
        const filtered = submissions.filter(sub => {
            const matchesSearch = sub.fullName.toLowerCase().includes(searchQuery) || 
                                 (sub.leoId && sub.leoId.toLowerCase().includes(searchQuery));
            const matchesPosition = !selectedPos || sub.positionValue === selectedPos;
            const matchesStatus = !selectedStatus || sub.status === selectedStatus;
            
            return matchesSearch && matchesPosition && matchesStatus;
        });

        if (filtered.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:#64748b;">No matching submissions found.</td></tr>';
            return;
        }

        // Reverse to show newest first
        filtered.slice().reverse().forEach(sub => {
            const date = new Date(sub.date).toLocaleDateString();
            const contact = sub.emailId !== 'N/A' ? sub.emailId : sub.contactNo;
            const leoIdDisplay = sub.hasLeoId === 'yes' ? sub.leoId : '<span style="color:#94a3b8">None</span>';
            
            const tr = document.createElement('tr');
            
            // Build Action Cells
            tr.innerHTML = `
                <td>${date}</td>
                <td><strong>${sub.fullName}</strong></td>
                <td>${leoIdDisplay}</td>
                <td>${sub.positionApplyingFor}</td>
                <td>${contact}</td>
                <td><code>${sub.transactionCode || 'N/A'}</code></td>
                <td><span class="status-badge ${sub.status.toLowerCase()}">${sub.status}</span></td>
            `;

            // Actions Cell
            const tdActions = document.createElement('td');
            tdActions.className = 'actions-cell';

            // View Details Button
            const btnView = document.createElement('button');
            btnView.className = 'btn-action btn-view';
            btnView.textContent = 'View';
            btnView.addEventListener('click', () => showDetailsModal(sub));
            tdActions.appendChild(btnView);

            // Approve Button
            const btnApprove = document.createElement('button');
            btnApprove.className = 'btn-action btn-approve';
            btnApprove.textContent = 'Approve';
            btnApprove.addEventListener('click', () => updateStatus(sub.id, 'Approved'));
            tdActions.appendChild(btnApprove);

            // Reject Button
            const btnReject = document.createElement('button');
            btnReject.className = 'btn-action btn-reject';
            btnReject.textContent = 'Reject';
            btnReject.addEventListener('click', () => updateStatus(sub.id, 'Rejected'));
            tdActions.appendChild(btnReject);

            // Delete Button
            const btnDeleteSub = document.createElement('button');
            btnDeleteSub.className = 'btn-action btn-delete';
            btnDeleteSub.textContent = 'Delete';
            btnDeleteSub.addEventListener('click', () => {
                showConfirm(
                    'Delete Submission',
                    `Are you sure you want to delete the nomination submission from "${sub.fullName}"? This will also delete all uploaded files for this application.`,
                    async () => {
                        try {
                            const res = await fetch(`/api/nominations?id=${sub.id}`, {
                                method: 'DELETE',
                                headers: getAuthHeaders()
                            });
                            if (res.ok) {
                                submissions = submissions.filter(s => s.id !== sub.id);
                                updateStats();
                                renderTable();
                                showAdminToast(`✓ Deleted submission from "${sub.fullName}"`);
                            } else {
                                showAdminToast('Failed to delete submission from server.', false);
                            }
                        } catch (err) {
                            console.error('Error deleting submission:', err);
                            showAdminToast('Connection error. Failed to delete.', false);
                        }
                    }
                );
            });
            tdActions.appendChild(btnDeleteSub);

            tr.appendChild(tdActions);
            tableBody.appendChild(tr);
        });
    }

    async function updateStatus(id, newStatus) {
        try {
            const res = await fetch('/api/nominations', {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ id, status: newStatus })
            });
            if (res.ok) {
                const index = submissions.findIndex(s => s.id === id);
                if (index !== -1) {
                    const sub = submissions[index];
                    sub.status = newStatus;
                    updateStats();
                    renderTable();
                    
                    // Trigger notification
                    sendEmailNotification(sub, newStatus);
                    showAdminToast(`✓ Application status updated to ${newStatus}`);
                }
            } else {
                showAdminToast('Failed to update status on server.', false);
            }
        } catch (err) {
            console.error('Error updating status:', err);
            showAdminToast('Connection error. Failed to update status.', false);
        }
    }

    function showConfirm(title, message, onConfirm, okText = 'Delete') {
        const modal = document.getElementById('confirmModal');
        const titleEl = document.getElementById('confirmTitle');
        const msgEl = document.getElementById('confirmMessage');
        const okBtn = document.getElementById('confirmOkBtn');
        const cancelBtn = document.getElementById('confirmCancelBtn');
        
        if (!modal) {
            if (confirm(message)) {
                onConfirm();
            }
            return;
        }
        
        titleEl.textContent = title;
        msgEl.textContent = message;
        okBtn.textContent = okText;
        
        if (okText === 'Logout') {
            okBtn.style.backgroundColor = 'var(--primary-blue)';
        } else {
            okBtn.style.backgroundColor = '#e74c3c';
        }
        
        const newOkBtn = okBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOkBtn, okBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        newOkBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            onConfirm();
        });
        
        newCancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        modal.style.display = 'block';
    }

    function showAdminToast(message, isSuccess = true) {
        let toast = document.getElementById('adminToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'adminToast';
            toast.className = 'success-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        if (!isSuccess) {
            toast.style.background = '#e74c3c';
        } else {
            toast.style.background = '#1a7a4a';
        }
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(100px)';
        }, 4000);
    }

    function sendEmailNotification(sub, status) {
        // Fallback check: if email is N/A or empty
        if (!sub.emailId || sub.emailId === 'N/A' || !sub.emailId.includes('@')) {
            showAdminToast(`Cannot send email: Invalid email address for ${sub.fullName}`, false);
            return;
        }

        const templateParams = {
            to_name: sub.fullName,
            to_email: sub.emailId,
            position: sub.positionApplyingFor,
            status: status,
            message: status === 'Approved' 
                ? `We are pleased to inform you that your nomination for the position of ${sub.positionApplyingFor} has been APPROVED by the committee. Best of luck!`
                : `Thank you for your interest in nominating yourself. We regret to inform you that your application for the position of ${sub.positionApplyingFor} has been REJECTED by the nomination committee.`
        };

        const triggerMailtoFallback = () => {
            // Prefill subject & body for mailto link
            const subject = encodeURIComponent(`Leo Club Nomination Status: ${status}`);
            const body = encodeURIComponent(`Dear ${sub.fullName},\n\n` + 
                (status === 'Approved'
                    ? `We are pleased to inform you that your nomination for the position of ${sub.positionApplyingFor} in LEO CLUB OF KATHMANDU ALKA has been APPROVED by the committee. Best of luck for the election!`
                    : `Thank you for your interest in nominating yourself. We regret to inform you that your application for the position of ${sub.positionApplyingFor} has been REJECTED by the nomination committee.`) + 
                `\n\nBest Regards,\nNomination Committee\nLeo Club of Kathmandu Alka`);
            
            // Open mailto link
            window.location.href = `mailto:${sub.emailId}?subject=${subject}&body=${body}`;
            showAdminToast(`Opening mail client to notify ${sub.emailId}`);
        };

        // If EmailJS is missing or keys are placeholder credentials
        if (typeof emailjs === 'undefined') {
            triggerMailtoFallback();
            return;
        }

        emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams)
            .then(() => {
                showAdminToast(`✓ Notification email sent to ${sub.emailId}`);
            }, (error) => {
                console.warn('EmailJS send error, opening local mail client fallback:', error);
                triggerMailtoFallback();
            });
    }

    function getMediaHtml(fileName, label, leoId, hasLeoId, subId, fieldKey) {
        if (label === 'Club Dues Receipt') {
            const isVerifiedPaid = (hasLeoId === 'yes' && leoId && typeof memberData !== 'undefined' && memberData[leoId] && memberData[leoId].duesPaid);
            const isTextPaid = fileName && (fileName === 'Paid (Automatically Verified)' || fileName === 'Verified / Exempt' || fileName.toLowerCase().includes('paid'));
            
            if (isVerifiedPaid || isTextPaid) {
                return `<span style="color:#2ecc71; font-weight: 600; display: inline-flex; align-items: center; gap: 0.25rem;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Paid (Automatically Verified)
                </span>`;
            }
        }

        if (!fileName || fileName === 'N/A' || fileName === 'Verified / Exempt') {
            return `<span style="color:#94a3b8">${fileName || 'N/A'}</span>`;
        }

        // Return a placeholder container that will be populated asynchronously
        const placeholderId = `preview-${subId}-${fieldKey}`;
        return `<div id="${placeholderId}" class="media-preview-container" style="width: 100%;">
            <div style="font-weight: 500; font-family: monospace; font-size: 0.85rem; color: #64748b; margin-bottom: 0.25rem;">File: ${fileName}</div>
            <div style="font-size: 0.85rem; color: #94a3b8; font-style: italic;">Loading preview...</div>
        </div>`;
    }

    async function loadMediaPreviews(sub) {
        const fields = [
            { key: 'formalPhoto', name: sub.formalPhotoName, url: sub.formalPhotoUrl, label: 'Formal Photo' },
            { key: 'candidateSignature', name: sub.signatureName, url: sub.signatureUrl, label: 'Candidate Signature' },
            { key: 'citizenship', name: sub.citizenshipName, url: sub.citizenshipUrl, label: 'Citizenship Copy' },
            { key: 'coverLetter', name: sub.coverLetterName || (sub.coverLetter && sub.coverLetter.includes('.') ? sub.coverLetter : 'N/A'), url: sub.coverLetterUrl, label: 'Cover Letter File' },
            { key: 'duesReceipt', name: sub.duesReceiptName, url: sub.duesReceiptUrl, label: 'Club Dues Receipt' },
            { key: 'nominationReceipt', name: sub.nominationReceiptName, url: sub.nominationReceiptUrl, label: 'Nomination Fee Receipt' }
        ];

        for (const field of fields) {
            const containerId = `preview-${sub.id}-${field.key}`;
            const container = document.getElementById(containerId);
            if (!container) continue;

            const fileName = field.name;
            if (!fileName || fileName === 'N/A' || fileName === 'Verified / Exempt') continue;

            try {
                let fileBlob = null;
                if (typeof LeoDb !== 'undefined') {
                    fileBlob = await LeoDb.getFile(sub.id, field.key);
                }

                const ext = fileName.split('.').pop().toLowerCase();
                const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
                const isPdf = ext === 'pdf';

                let innerHtml = `<div style="font-weight: 500; font-family: monospace; font-size: 0.85rem; color: #64748b; margin-bottom: 0.25rem;">File: ${fileName}</div>`;

                // Create a temporary Blob Object URL if the file exists locally in IndexedDB, fallback to standard link
                const fileUrl = fileBlob ? URL.createObjectURL(fileBlob) : (field.url && field.url !== 'N/A' ? field.url : fileName);

                if (isImage) {
                    innerHtml += `<div style="margin-top: 0.4rem; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #f8fafc; padding: 0.5rem; max-width: 100%; display: inline-flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.4rem;">
                        <img src="${fileUrl}" alt="${field.label}" style="max-width: 100%; max-height: 220px; border-radius: 4px; object-fit: contain;" onerror="this.outerHTML='<div style=&quot;padding: 1rem; color: #94a3b8; font-size: 0.85rem; font-weight: 500;&quot;>⚠ Preview unavailable (Failed to download)</div>'">
                        <a href="${fileUrl}" download="${fileName}" target="_blank" style="background: var(--primary-blue); color: white; border: none; padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.8rem; cursor: pointer; text-decoration: none; font-weight: bold; align-self: flex-start;">Download Image</a>
                    </div>`;
                } else if (isPdf) {
                    innerHtml += `<div style="margin-top: 0.4rem; display: inline-flex; gap: 0.5rem; align-items: center; background: #fee2e2; border: 1px solid #fca5a5; padding: 0.5rem 0.8rem; border-radius: 6px; color: #991b1b; font-weight: 600;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                        PDF Document
                        <a href="${fileUrl}" download="${fileName}" target="_blank" style="background: #ef4444; color: white; border: none; padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.8rem; cursor: pointer; text-decoration: none; font-weight: bold; margin-left: 0.5rem;">Download PDF</a>
                    </div>`;
                } else {
                    innerHtml += `<div style="margin-top: 0.4rem; display: inline-flex; gap: 0.5rem; align-items: center; background: #f1f5f9; border: 1px solid #cbd5e1; padding: 0.5rem 0.8rem; border-radius: 6px; color: #334155; font-weight: 600;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                        Document File
                        <a href="${fileUrl}" download="${fileName}" target="_blank" style="background: var(--primary-blue); color: white; border: none; padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.8rem; cursor: pointer; text-decoration: none; font-weight: bold; margin-left: 0.5rem;">Download File</a>
                    </div>`;
                }

                container.innerHTML = innerHtml;
            } catch (err) {
                console.error(`Error loading preview for ${field.key}`, err);
                container.innerHTML = `<div style="font-size: 0.85rem; color: #e74c3c;">Failed to load preview for ${fileName}</div>`;
            }
        }
    }

    function showDetailsModal(sub) {
        let detailsHtml = '';

        // Section 1: Candidate Info
        detailsHtml += '<div class="detail-section-title">1. Candidate Information</div>';
        detailsHtml += `<div class="detail-item"><span class="detail-label">Full Name</span><span class="detail-value"><strong>${sub.fullName}</strong></span></div>`;
        detailsHtml += `<div class="detail-item"><span class="detail-label">Member Type</span><span class="detail-value">${sub.hasLeoId === 'yes' ? 'Registered Leo Member' : 'Manual / Guest Registration'}</span></div>`;
        if (sub.hasLeoId === 'yes') {
            detailsHtml += `<div class="detail-item"><span class="detail-label">Leo ID</span><span class="detail-value">${sub.leoId}</span></div>`;
        }
        detailsHtml += `<div class="detail-item"><span class="detail-label">Contact Email</span><span class="detail-value">${sub.emailId || 'N/A'}</span></div>`;
        if (sub.contactNo && sub.contactNo !== 'N/A') {
            detailsHtml += `<div class="detail-item"><span class="detail-label">Contact Phone</span><span class="detail-value">${sub.contactNo}</span></div>`;
        }
        detailsHtml += `<div class="detail-item"><span class="detail-label">Current Position</span><span class="detail-value">${sub.currentPosition || 'N/A'}</span></div>`;

        // Section 2: Nomination Detail
        detailsHtml += '<div class="detail-section-title">2. Position Details</div>';
        detailsHtml += `<div class="detail-item"><span class="detail-label">Applying For</span><span class="detail-value"><strong>${sub.positionApplyingFor}</strong></span></div>`;
        detailsHtml += `<div class="detail-item"><span class="detail-label">Fee Amount</span><span class="detail-value">${sub.fee || 'N/A'}</span></div>`;
        detailsHtml += `<div class="detail-item"><span class="detail-label">Transaction Code</span><span class="detail-value"><code>${sub.transactionCode || 'N/A'}</code></span></div>`;
        detailsHtml += `<div class="detail-item"><span class="detail-label">Submission Date</span><span class="detail-value">${new Date(sub.date).toLocaleString()}</span></div>`;

        // Section 3: Uploaded Files
        detailsHtml += '<div class="detail-section-title">3. Uploaded Documents</div>';
        detailsHtml += `<div class="detail-item" style="flex-direction: column; align-items: flex-start; gap: 0.25rem;"><span class="detail-label" style="width: 100%;">Formal Photo</span><span class="detail-value" style="width: 100%;">${getMediaHtml(sub.formalPhotoName, 'Formal Photo', sub.leoId, sub.hasLeoId, sub.id, 'formalPhoto')}</span></div>`;
        detailsHtml += `<div class="detail-item" style="flex-direction: column; align-items: flex-start; gap: 0.25rem;"><span class="detail-label" style="width: 100%;">Candidate Signature</span><span class="detail-value" style="width: 100%;">${getMediaHtml(sub.signatureName, 'Candidate Signature', sub.leoId, sub.hasLeoId, sub.id, 'candidateSignature')}</span></div>`;
        detailsHtml += `<div class="detail-item" style="flex-direction: column; align-items: flex-start; gap: 0.25rem;"><span class="detail-label" style="width: 100%;">Citizenship Copy</span><span class="detail-value" style="width: 100%;">${getMediaHtml(sub.citizenshipName, 'Citizenship Copy', sub.leoId, sub.hasLeoId, sub.id, 'citizenship')}</span></div>`;
        
        const coverName = sub.coverLetterName || (sub.coverLetter && sub.coverLetter.includes('.') ? sub.coverLetter : 'N/A');
        detailsHtml += `<div class="detail-item" style="flex-direction: column; align-items: flex-start; gap: 0.25rem;"><span class="detail-label" style="width: 100%;">Cover Letter File</span><span class="detail-value" style="width: 100%;">${getMediaHtml(coverName, 'Cover Letter File', sub.leoId, sub.hasLeoId, sub.id, 'coverLetter')}</span></div>`;
        
        detailsHtml += `<div class="detail-item" style="flex-direction: column; align-items: flex-start; gap: 0.25rem;"><span class="detail-label" style="width: 100%;">Club Dues Receipt</span><span class="detail-value" style="width: 100%;">${getMediaHtml(sub.duesReceiptName, 'Club Dues Receipt', sub.leoId, sub.hasLeoId, sub.id, 'duesReceipt')}</span></div>`;
        detailsHtml += `<div class="detail-item" style="flex-direction: column; align-items: flex-start; gap: 0.25rem;"><span class="detail-label" style="width: 100%;">Nomination Fee Receipt</span><span class="detail-value" style="width: 100%;">${getMediaHtml(sub.nominationReceiptName, 'Nomination Fee Receipt', sub.leoId, sub.hasLeoId, sub.id, 'nominationReceipt')}</span></div>`;

        // Section 4: Candidate Statements
        detailsHtml += '<div class="detail-section-title">4. Candidate Statements</div>';
        detailsHtml += `<div class="detail-item-statement"><strong>Past Experience and Learning as Member:</strong><div class="statement-text">${sub.pastExperience || 'N/A'}</div></div>`;
        detailsHtml += `<div class="detail-item-statement"><strong>Areas of Interest:</strong><div class="statement-text">${sub.areasOfInterest || 'N/A'}</div></div>`;
        detailsHtml += `<div class="detail-item-statement"><strong>Plans with respect to Position:</strong><div class="statement-text">${sub.futurePlans || 'N/A'}</div></div>`;

        // Backward compatibility: If there's old cover letter text but no statements
        if (sub.coverLetter && !sub.coverLetterName && !sub.pastExperience) {
            detailsHtml += '<div class="detail-section-title">Legacy Cover Letter Text</div>';
            detailsHtml += `<div style="background: #f8fafc; border-left: 4px solid var(--accent-gold); padding: 1.2rem; border-radius: 6px; font-style: italic; white-space: pre-wrap; color: #475569; margin-bottom: 1rem; border: 1px solid #e2e8f0; border-left-width: 4px; max-height: 200px; overflow-y: auto;">${sub.coverLetter}</div>`;
        }

        modalDetailsContent.innerHTML = detailsHtml;
        detailsModal.style.display = 'block';
        loadMediaPreviews(sub);
    }

    function closeModal() {
        detailsModal.style.display = 'none';
    }

    // Modal Close Events
    closeDetailsBtn.addEventListener('click', closeModal);
    closeDetailsModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === detailsModal) {
            closeModal();
        }
    });

    // Search and Filter Events
    searchInput.addEventListener('input', renderTable);
    positionFilter.addEventListener('change', renderTable);
    statusFilter.addEventListener('change', renderTable);

    // Clear Data Event
    clearDataBtn.addEventListener('click', () => {
        showConfirm(
            'Delete All Submissions',
            'Are you sure you want to delete all submissions? This cannot be undone.',
            async () => {
                try {
                    const res = await fetch('/api/nominations?id=all', {
                        method: 'DELETE',
                        headers: getAuthHeaders()
                    });
                    if (res.ok) {
                        submissions = [];
                        updateStats();
                        renderTable();
                        showAdminToast('✓ Successfully cleared all nomination submissions.');
                    } else {
                        showAdminToast('Failed to clear nominations on server.', false);
                    }
                } catch (err) {
                    console.error('Error clearing data:', err);
                    showAdminToast('Connection error. Failed to clear nominations.', false);
                }
            }
        );
    });

    // Export to Excel (XLSX) Functionality
    exportCsvBtn.addEventListener('click', () => {
        if (submissions.length === 0) {
            alert('No submissions available to export.');
            return;
        }

        const today = new Date();
        const dateStr = today.toISOString().split('T')[0]; // Formats as YYYY-MM-DD
        const filename = `nomination_${dateStr}`;

        const headers = [
            'Submission ID',
            'Submission Date',
            'Full Name',
            'Has Leo ID',
            'Leo ID',
            'Email ID',
            'Contact No',
            'Current Position',
            'Position Applying For',
            'Nomination Fee',
            'Transaction Code',
            'Status',
            'Formal Photo File',
            'Candidate Signature File',
            'Citizenship Copy File',
            'Cover Letter File / Text',
            'Club Dues Receipt File',
            'Nomination Fee Receipt File',
            'Past Experience',
            'Areas of Interest',
            'Future Plans'
        ];
        
        const rows = [headers];

        submissions.forEach(sub => {
            const isVerifiedPaid = (sub.hasLeoId === 'yes' && sub.leoId && typeof memberData !== 'undefined' && memberData[sub.leoId] && memberData[sub.leoId].duesPaid);
            const isTextPaid = sub.duesReceiptName && (sub.duesReceiptName === 'Paid (Automatically Verified)' || sub.duesReceiptName === 'Verified / Exempt' || sub.duesReceiptName.toLowerCase().includes('paid'));
            const duesReceiptText = (isVerifiedPaid || isTextPaid) ? 'Paid (Automatically Verified)' : (sub.duesReceiptName || 'N/A');

            const row = [
                sub.id,
                new Date(sub.date).toLocaleString(),
                sub.fullName,
                sub.hasLeoId,
                sub.leoId || 'N/A',
                sub.emailId || 'N/A',
                sub.contactNo || 'N/A',
                sub.currentPosition || 'N/A',
                sub.positionApplyingFor,
                sub.fee,
                sub.transactionCode || 'N/A',
                sub.status,
                sub.formalPhotoName || 'N/A',
                sub.signatureName || 'N/A',
                sub.citizenshipName || 'N/A',
                sub.coverLetterName || sub.coverLetter || 'N/A',
                duesReceiptText,
                sub.nominationReceiptName || 'N/A',
                sub.pastExperience || 'N/A',
                sub.areasOfInterest || 'N/A',
                sub.futurePlans || 'N/A'
            ];
            rows.push(row);
        });

        try {
            if (typeof XLSX !== 'undefined') {
                const worksheet = XLSX.utils.aoa_to_sheet(rows);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Nominations");
                XLSX.writeFile(workbook, `${filename}.xlsx`);
            } else {
                console.warn("SheetJS library is not loaded. Falling back to CSV export.");
                
                let csvContent = '\uFEFF'; // Add UTF-8 BOM for Excel formatting
                csvContent += headers.join(',') + '\n';

                const escapeCSV = (val) => {
                    if (val === undefined || val === null) return '';
                    const str = String(val);
                    return `"${str.replace(/"/g, '""')}"`;
                };

                submissions.forEach(sub => {
                    const isVerifiedPaid = (sub.hasLeoId === 'yes' && sub.leoId && typeof memberData !== 'undefined' && memberData[sub.leoId] && memberData[sub.leoId].duesPaid);
                    const isTextPaid = sub.duesReceiptName && (sub.duesReceiptName === 'Paid (Automatically Verified)' || sub.duesReceiptName === 'Verified / Exempt' || sub.duesReceiptName.toLowerCase().includes('paid'));
                    const duesReceiptText = (isVerifiedPaid || isTextPaid) ? 'Paid (Automatically Verified)' : (sub.duesReceiptName || 'N/A');

                    const row = [
                        sub.id,
                        new Date(sub.date).toLocaleString(),
                        sub.fullName,
                        sub.hasLeoId,
                        sub.leoId || 'N/A',
                        sub.emailId || 'N/A',
                        sub.contactNo || 'N/A',
                        sub.currentPosition || 'N/A',
                        sub.positionApplyingFor,
                        sub.fee,
                        sub.transactionCode || 'N/A',
                        sub.status,
                        sub.formalPhotoName || 'N/A',
                        sub.citizenshipName || 'N/A',
                        sub.coverLetterName || sub.coverLetter || 'N/A',
                        duesReceiptText,
                        sub.nominationReceiptName || 'N/A',
                        sub.pastExperience || 'N/A',
                        sub.areasOfInterest || 'N/A',
                        sub.futurePlans || 'N/A'
                    ].map(escapeCSV);
                    
                    csvContent += row.join(',') + '\n';
                });

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.setAttribute('href', url);
                link.setAttribute('download', `${filename}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (err) {
            console.error("Export error:", err);
            alert("An error occurred while exporting the data.");
        }
    });

    // Export to PDF Profile Sheets Functionality
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', async () => {
            if (submissions.length === 0) {
                alert('No submissions available to export.');
                return;
            }

            // Disable button and show loader
            exportPdfBtn.disabled = true;
            const originalText = exportPdfBtn.textContent;
            exportPdfBtn.textContent = 'Generating PDF...';

            try {
                // Create print container
                const printContainer = document.createElement('div');
                printContainer.id = 'printReportContainer';
                
                const imgPromises = [];
                const objectUrls = [];

                for (const sub of submissions) {
                    // Fetch photo blob from IndexedDB if available
                    let photoUrl = '';
                    let isBlobUrl = false;
                    if (sub.formalPhotoName && sub.formalPhotoName !== 'N/A') {
                        try {
                            if (typeof LeoDb !== 'undefined') {
                                const photoBlob = await LeoDb.getFile(sub.id, 'formalPhoto');
                                if (photoBlob) {
                                    photoUrl = URL.createObjectURL(photoBlob);
                                    objectUrls.push(photoUrl);
                                    isBlobUrl = true;
                                }
                            }
                        } catch (err) {
                            console.error(`Failed to load photo for ${sub.fullName}`, err);
                        }

                        // FALLBACK: If IndexedDB didn't return a blob, use the Vercel Blob URL from the database
                        if (!photoUrl) {
                            photoUrl = sub.formalPhotoUrl || sub.formalPhotoName;
                        }
                    }

                    // Fetch signature blob from IndexedDB if available
                    let sigUrl = '';
                    if (sub.signatureName && sub.signatureName !== 'N/A') {
                        try {
                            if (typeof LeoDb !== 'undefined') {
                                const sigBlob = await LeoDb.getFile(sub.id, 'candidateSignature');
                                if (sigBlob) {
                                    sigUrl = URL.createObjectURL(sigBlob);
                                    objectUrls.push(sigUrl);
                                }
                            }
                        } catch (err) {
                            console.error(`Failed to load signature for ${sub.fullName}`, err);
                        }

                        // FALLBACK: If IndexedDB didn't return a signature blob, use the Vercel Blob URL from the database
                        if (!sigUrl) {
                            sigUrl = sub.signatureUrl || sub.signatureName;
                        }
                    }

                    // Check dues payment status
                    const isVerifiedPaid = (sub.hasLeoId === 'yes' && sub.leoId && typeof memberData !== 'undefined' && memberData[sub.leoId] && memberData[sub.leoId].duesPaid);
                    const isTextPaid = sub.duesReceiptName && (sub.duesReceiptName === 'Paid (Automatically Verified)' || sub.duesReceiptName === 'Verified / Exempt' || sub.duesReceiptName.toLowerCase().includes('paid'));
                    const duesStatusHtml = (isVerifiedPaid || isTextPaid) 
                        ? '<span class="print-file-status">✓ Paid (Verified)</span>' 
                        : (sub.duesReceiptName && sub.duesReceiptName !== 'N/A' 
                            ? `<span class="print-file-status">✓ Uploaded (${sub.duesReceiptName})</span>` 
                            : '<span class="print-file-status missing">✗ Missing / Pending</span>');

                    const citizenshipStatusHtml = (sub.citizenshipName && sub.citizenshipName !== 'N/A')
                        ? `<span class="print-file-status">✓ Uploaded (${sub.citizenshipName})</span>`
                        : '<span class="print-file-status missing">✗ Missing</span>';

                    const coverLetterStatusHtml = (sub.coverLetterName && sub.coverLetterName !== 'N/A')
                        ? `<span class="print-file-status">✓ Uploaded (${sub.coverLetterName})</span>`
                        : (sub.coverLetter && !sub.coverLetter.includes('.')
                            ? '<span class="print-file-status">✓ Text Entered</span>'
                            : '<span class="print-file-status missing">✗ Missing</span>');

                    const nominationFeeStatusHtml = (sub.nominationReceiptName && sub.nominationReceiptName !== 'N/A')
                        ? `<span class="print-file-status">✓ Uploaded (${sub.nominationReceiptName})</span>`
                        : '<span class="print-file-status missing">✗ Missing</span>';

                    const signatureStatusHtml = (sub.signatureName && sub.signatureName !== 'N/A')
                        ? `<span class="print-file-status">✓ Uploaded (${sub.signatureName})</span>`
                        : '<span class="print-file-status missing">✗ Missing</span>';

                    // Profile card HTML container
                    const card = document.createElement('div');
                    card.className = 'print-profile-card';

                    // Construct Card inner HTML
                    let cardHtml = `
                        <div class="print-header">
                            <img src="leo.jpg" alt="Leo Logo" class="print-logo" onerror="this.style.display='none'">
                            <div class="print-header-title">
                                <h1>LEO CLUB OF KATHMANDU ALKA</h1>
                                <p>Candidate Nomination Profile | ${localStorage.getItem('leoNominationTenure') || 'L.Y. 2025/26'}</p>
                            </div>
                            <img src="alka.png" alt="Alka Logo" class="print-logo" onerror="this.style.display='none'">
                        </div>
                        
                        <div class="print-row">
                            <div class="print-photo-container">
                    `;

                    if (photoUrl) {
                        cardHtml += `
                            <img src="${photoUrl}" alt="${sub.fullName}" id="print-img-${sub.id}" onerror="this.style.display='none'; document.getElementById('print-placeholder-${sub.id}').style.display='flex';">
                            <div class="print-placeholder-photo" id="print-placeholder-${sub.id}" style="display: none;">${sub.fullName.charAt(0)}</div>
                        `;
                    } else {
                        cardHtml += `<div class="print-placeholder-photo" id="print-placeholder-${sub.id}">${sub.fullName.charAt(0)}</div>`;
                    }

                    cardHtml += `
                            </div>
                            <div style="flex-grow: 1;">
                                <table class="print-details-table">
                                    <tr>
                                        <td class="label">Candidate Name</td>
                                        <td class="value"><strong>${sub.fullName}</strong></td>
                                    </tr>
                                    <tr>
                                        <td class="label">Leo Membership Status</td>
                                        <td class="value">${sub.hasLeoId === 'yes' ? 'Registered Leo Member' : 'Manual / Guest Registration'}</td>
                                    </tr>
                    `;

                    if (sub.hasLeoId === 'yes') {
                        cardHtml += `
                                    <tr>
                                        <td class="label">Leo ID</td>
                                        <td class="value">${sub.leoId}</td>
                                    </tr>
                        `;
                    }

                    cardHtml += `
                                    <tr>
                                        <td class="label">Contact Email</td>
                                        <td class="value">${sub.emailId || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td class="label">Contact Number</td>
                                        <td class="value">${sub.contactNo || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td class="label">Current Position</td>
                                        <td class="value">${sub.currentPosition || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td class="label">Applying Position</td>
                                        <td class="value"><strong>${sub.positionApplyingFor}</strong></td>
                                    </tr>
                                    <tr>
                                        <td class="label">Nomination Fee Code</td>
                                        <td class="value"><code>${sub.transactionCode || 'N/A'}</code> (Rs. ${sub.fee})</td>
                                    </tr>
                                    <tr>
                                        <td class="label">Submission Date</td>
                                        <td class="value">${new Date(sub.date).toLocaleString()}</td>
                                    </tr>
                                    <tr>
                                        <td class="label">Application Status</td>
                                        <td class="value"><strong>${sub.status}</strong></td>
                                    </tr>
                                </table>
                            </div>
                        </div>

                        <div class="print-section-title">Documents Verification Checklist</div>
                        <div class="print-files-grid">
                            <div class="print-file-item">
                                <strong>Club Dues:</strong> ${duesStatusHtml}
                            </div>
                            <div class="print-file-item">
                                <strong>Citizenship Copy:</strong> ${citizenshipStatusHtml}
                            </div>
                            <div class="print-file-item">
                                <strong>Cover Letter:</strong> ${coverLetterStatusHtml}
                            </div>
                            <div class="print-file-item">
                                <strong>Nomination Fee:</strong> ${nominationFeeStatusHtml}
                            </div>
                            <div class="print-file-item" style="grid-column: span 2;">
                                <strong>Candidate Signature:</strong> ${signatureStatusHtml}
                            </div>
                        </div>

                        <div class="print-section-title">Candidate Statements</div>
                        
                        <div style="margin-bottom: 10px;">
                            <strong style="font-size: 12px; color: #64748b;">Past Experience & Learning:</strong>
                            <div class="print-statement-box">${sub.pastExperience || 'N/A'}</div>
                        </div>
                        <div style="margin-bottom: 10px;">
                            <strong style="font-size: 12px; color: #64748b;">Areas of Interest:</strong>
                            <div class="print-statement-box">${sub.areasOfInterest || 'N/A'}</div>
                        </div>
                        <div style="margin-bottom: 10px;">
                            <strong style="font-size: 12px; color: #64748b;">Future Plans / Vision:</strong>
                            <div class="print-statement-box">${sub.futurePlans || 'N/A'}</div>
                        </div>
                    `;

                    if (sub.coverLetter && !sub.coverLetterName && !sub.pastExperience) {
                        cardHtml += `
                            <div style="margin-bottom: 10px;">
                                <strong style="font-size: 12px; color: #64748b;">Legacy Cover Letter Text:</strong>
                                <div class="print-statement-box">${sub.coverLetter}</div>
                            </div>
                        `;
                    }

                    // Append signature and stamp box layout
                    cardHtml += `
                        <div class="print-signature-section">
                            <div class="print-signature-box">
                                <div class="print-signature-line" style="display: flex; align-items: center; justify-content: center; position: relative;">
                                    ${sigUrl ? `<img src="${sigUrl}" id="print-sig-${sub.id}" alt="Signature" style="max-height: 45px; max-width: 100%; object-fit: contain; position: absolute; bottom: 2px;" onerror="this.style.display='none';">` : ''}
                                </div>
                                <p>Candidate Signature</p>
                            </div>
                            <div class="print-stamp-box">
                                <p>Club Stamp<br>/ Seal</p>
                            </div>
                            <div class="print-signature-box">
                                <div class="print-signature-line"></div>
                                <p>Election Committee Chairperson</p>
                            </div>
                        </div>
                    `;

                    card.innerHTML = cardHtml;
                    printContainer.appendChild(card);

                    // Monitor image load
                    if (photoUrl) {
                        const imgPromise = new Promise(resolve => {
                            const imgEl = card.querySelector(`#print-img-${sub.id}`);
                            if (imgEl) {
                                if (imgEl.complete) {
                                    resolve();
                                } else {
                                    imgEl.onload = resolve;
                                    imgEl.onerror = resolve;
                                }
                            } else {
                                resolve();
                            }
                        });
                        imgPromises.push(imgPromise);
                    }

                    if (sigUrl) {
                        const imgPromise = new Promise(resolve => {
                            const imgEl = card.querySelector(`#print-sig-${sub.id}`);
                            if (imgEl) {
                                if (imgEl.complete) {
                                    resolve();
                                } else {
                                    imgEl.onload = resolve;
                                    imgEl.onerror = resolve;
                                }
                            } else {
                                resolve();
                            }
                        });
                        imgPromises.push(imgPromise);
                    }
                }

                document.body.appendChild(printContainer);

                // Add promises for any headers/logos if they exist
                const logoImgs = printContainer.querySelectorAll('.print-logo');
                logoImgs.forEach(logo => {
                    const logoPromise = new Promise(resolve => {
                        if (logo.complete) {
                            resolve();
                        } else {
                            logo.onload = resolve;
                            logo.onerror = resolve;
                        }
                    });
                    imgPromises.push(logoPromise);
                });

                // Wait for all images to render
                await Promise.all(imgPromises);
                
                // Allow layout engine to calculate styles
                await new Promise(r => setTimeout(r, 300));

                window.print();

                // Clean up object URLs
                objectUrls.forEach(url => URL.revokeObjectURL(url));
                
                // Remove print container
                document.body.removeChild(printContainer);

            } catch (err) {
                console.error('Failed to generate PDF Print Report:', err);
                alert('An error occurred while generating the PDF report.');
            } finally {
                exportPdfBtn.disabled = false;
                exportPdfBtn.textContent = originalText;
            }
        });
    }

    // Initial Load / Authentication Check
    checkAuth();
});
