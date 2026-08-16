(function (window) {
    let allContacts = [];
    let expandedId = null;

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    function showAlert(message, type) {
        document.getElementById('contactsAlert').innerHTML =
            `<div class="admin-alert admin-alert-${type}">${message}</div>`;
    }

    function formatDate(dateStr) {
        return new Date(dateStr).toLocaleString();
    }

    function renderList(contacts) {
        const container = document.getElementById('contactsList');

        if (!contacts.length) {
            container.innerHTML = '<div class="admin-empty-state">No contact requests yet.</div>';
            return;
        }

        container.innerHTML = contacts.map(contact => `
            <div class="admin-item-row" style="flex-direction:column; align-items:stretch;">
                <div style="display:flex; justify-content:space-between; gap:0.75rem; cursor:pointer;" data-toggle="${contact._id}">
                    <div>
                        <p class="admin-item-title">
                            <span class="admin-badge${contact.source === 'chatbot' ? '' : ' admin-badge-inactive'}">${contact.source === 'chatbot' ? 'Chatbot' : 'Web Form'}</span>
                            <span class="admin-badge${contact.status === 'new' ? ' admin-badge-warning' : ''}">${contact.status}</span>
                            ${escapeHtml(contact.firstName)} ${escapeHtml(contact.lastName || '')} — ${escapeHtml(contact.subject)}
                        </p>
                        <p class="admin-item-meta">${escapeHtml(contact.email)}${contact.phone ? ' · ' + escapeHtml(contact.phone) : ''} · ${formatDate(contact.createdAt)}</p>
                    </div>
                    <div class="admin-item-actions">
                        <button class="admin-btn-small" data-toggle="${contact._id}">${expandedId === contact._id ? 'Hide' : 'View'}</button>
                    </div>
                </div>
                ${expandedId === contact._id ? renderDetail(contact) : ''}
            </div>
        `).join('');

        container.querySelectorAll('[data-toggle]').forEach(el => {
            el.addEventListener('click', () => {
                expandedId = expandedId === el.dataset.toggle ? null : el.dataset.toggle;
                renderList(allContacts);
            });
        });

        container.querySelectorAll('[data-save-status]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                saveStatus(btn.dataset.saveStatus);
            });
        });
    }

    function renderDetail(contact) {
        return `
            <div style="margin-top:0.75rem; padding-top:0.75rem; border-top:1px dashed #e5e7eb;">
                <p style="white-space:pre-wrap; margin-bottom:0.75rem;">${escapeHtml(contact.message)}</p>
                <p class="admin-item-meta" style="margin-bottom:0.5rem;">Preferred contact: ${escapeHtml(contact.preferredContactMethod || 'any')}${contact.conversationId ? ' · From conversation ' + escapeHtml(contact.conversationId.slice(0, 8)) : ''}</p>
                <div class="form-group">
                    <label for="status-${contact._id}">Status</label>
                    <select id="status-${contact._id}">
                        ${['new', 'read', 'replied', 'contacted', 'resolved', 'archived'].map(s =>
                            `<option value="${s}" ${contact.status === s ? 'selected' : ''}>${s}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="notes-${contact._id}">Admin notes</label>
                    <textarea id="notes-${contact._id}" rows="2">${escapeHtml(contact.adminNotes || '')}</textarea>
                </div>
                <button type="button" class="admin-btn-small" data-save-status="${contact._id}">Save</button>
            </div>
        `;
    }

    function buildQuery() {
        const status = document.getElementById('contactsStatusFilter').value;
        const source = document.getElementById('contactsSourceFilter').value;
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        if (source) params.set('source', source);
        params.set('limit', '100');
        return params.toString();
    }

    async function loadContacts() {
        try {
            const res = await AdminAuth.authFetch(`/api/contact?${buildQuery()}`);
            const data = await res.json();
            allContacts = data.contacts || [];
            renderList(allContacts);
        } catch (error) {
            document.getElementById('contactsList').innerHTML =
                `<div class="admin-empty-state">${error.message}</div>`;
        }
    }

    async function saveStatus(id) {
        const status = document.getElementById(`status-${id}`).value;
        const adminNotes = document.getElementById(`notes-${id}`).value;

        try {
            const res = await AdminAuth.authFetch(`/api/contact/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, adminNotes })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update status');

            showAlert('Contact request updated.', 'success');
            await loadContacts();
        } catch (error) {
            showAlert(error.message, 'error');
        }
    }

    function init() {
        document.getElementById('contactsStatusFilter').addEventListener('change', loadContacts);
        document.getElementById('contactsSourceFilter').addEventListener('change', loadContacts);
        loadContacts();
    }

    window.AdminContacts = { init };
})(window);
