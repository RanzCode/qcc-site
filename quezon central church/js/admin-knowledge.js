(function (window) {
    let editingId = null;
    let allEntries = [];

    const STATUS_LABELS = {
        VERIFIED: 'Verified',
        UNVERIFIED: 'Unverified',
        CONFLICTING: 'Conflicting',
        OUTDATED: 'Outdated',
        DISABLED: 'Disabled'
    };

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    function showAlert(message, type) {
        document.getElementById('knowledgeAlert').innerHTML =
            `<div class="admin-alert admin-alert-${type}">${message}</div>`;
    }

    function clearAlert() {
        document.getElementById('knowledgeAlert').innerHTML = '';
    }

    function resetForm() {
        editingId = null;
        document.getElementById('knowledgeId').value = '';
        document.getElementById('knowledgeKey').value = '';
        document.getElementById('knowledgeTitle').value = '';
        document.getElementById('knowledgeCategory').value = 'CHURCH_INFORMATION';
        document.getElementById('knowledgeContent').value = '';
        document.getElementById('knowledgeStatus').value = 'VERIFIED';
        document.getElementById('knowledgeConflictNotes').value = '';
        document.getElementById('knowledgeStructuredData').value = '';
        document.getElementById('knowledgeTags').value = '';
        document.getElementById('knowledgeSource').value = 'ADMIN_VERIFIED';
        document.getElementById('knowledgeSourceUrl').value = '';
        document.getElementById('knowledgeFormTitle').textContent = 'Add Knowledge Entry';
        document.getElementById('knowledgeSubmitBtn').textContent = 'Add Entry';
        document.getElementById('knowledgeCancelBtn').style.display = 'none';
    }

    function statusBadgeClass(status) {
        if (status === 'VERIFIED') return '';
        if (status === 'DISABLED') return ' admin-badge-inactive';
        return ' admin-badge-warning';
    }

    function renderList(entries) {
        const container = document.getElementById('knowledgeList');

        if (!entries.length) {
            container.innerHTML = '<div class="admin-empty-state">No knowledge entries yet.</div>';
            return;
        }

        container.innerHTML = entries.map(entry => `
            <div class="admin-item-row">
                <div>
                    <p class="admin-item-title">
                        <span class="admin-badge">${escapeHtml(entry.category)}</span>
                        <span class="admin-badge${statusBadgeClass(entry.status)}">${STATUS_LABELS[entry.status] || entry.status}</span>
                        ${escapeHtml(entry.title)}
                    </p>
                    <p class="admin-item-meta">${escapeHtml((entry.content || '').slice(0, 140))}${entry.content && entry.content.length > 140 ? '…' : ''}</p>
                </div>
                <div class="admin-item-actions">
                    ${entry.status !== 'VERIFIED' ? `<button class="admin-btn-small" data-verify="${entry._id}">Verify</button>` : ''}
                    <button class="admin-btn-small" data-edit="${entry._id}">Edit</button>
                    ${entry.status !== 'DISABLED' ? `<button class="admin-btn-small" data-disable="${entry._id}">Disable</button>` : ''}
                    <button class="admin-btn-small admin-btn-danger" data-delete="${entry._id}">Delete</button>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', () => editEntry(btn.dataset.edit));
        });
        container.querySelectorAll('[data-verify]').forEach(btn => {
            btn.addEventListener('click', () => verifyEntry(btn.dataset.verify));
        });
        container.querySelectorAll('[data-disable]').forEach(btn => {
            btn.addEventListener('click', () => disableEntry(btn.dataset.disable));
        });
        container.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', () => deleteEntry(btn.dataset.delete));
        });
    }

    function renderAttention(entries) {
        const card = document.getElementById('knowledgeAttentionCard');
        const list = document.getElementById('knowledgeAttentionList');

        if (!entries.length) {
            card.style.display = 'none';
            return;
        }

        card.style.display = 'block';
        list.innerHTML = entries.map(entry => `
            <div class="admin-item-row">
                <div>
                    <p class="admin-item-title">
                        <span class="admin-badge admin-badge-warning">${STATUS_LABELS[entry.status] || entry.status}</span>
                        ${escapeHtml(entry.title)}
                    </p>
                    <p class="admin-item-meta">${escapeHtml(entry.conflictNotes || entry.content || '').slice(0, 220)}</p>
                </div>
                <div class="admin-item-actions">
                    <button class="admin-btn-small" data-edit-attention="${entry._id}">Review</button>
                </div>
            </div>
        `).join('');

        list.querySelectorAll('[data-edit-attention]').forEach(btn => {
            btn.addEventListener('click', () => editEntry(btn.dataset.editAttention));
        });
    }

    async function loadAttention() {
        try {
            const res = await AdminAuth.authFetch('/api/knowledge/needs-attention');
            const data = await res.json();
            renderAttention(data.entries || []);
        } catch (error) {
            // Non-critical - the main list still loads.
        }
    }

    function buildQuery() {
        const category = document.getElementById('knowledgeCategoryFilter').value;
        const status = document.getElementById('knowledgeStatusFilter').value;
        const params = new URLSearchParams();
        if (category) params.set('category', category);
        if (status) params.set('status', status);
        params.set('limit', '100');
        return params.toString();
    }

    async function loadEntries() {
        try {
            const res = await AdminAuth.authFetch(`/api/knowledge?${buildQuery()}`);
            const data = await res.json();
            allEntries = data.entries || [];
            renderList(allEntries);
        } catch (error) {
            document.getElementById('knowledgeList').innerHTML =
                `<div class="admin-empty-state">${error.message}</div>`;
        }
    }

    function editEntry(id) {
        const entry = allEntries.find(e => e._id === id);
        if (!entry) return;

        editingId = id;
        document.getElementById('knowledgeId').value = id;
        document.getElementById('knowledgeKey').value = entry.key || '';
        document.getElementById('knowledgeTitle').value = entry.title;
        document.getElementById('knowledgeCategory').value = entry.category;
        document.getElementById('knowledgeContent').value = entry.content;
        document.getElementById('knowledgeStatus').value = entry.status;
        document.getElementById('knowledgeConflictNotes').value = entry.conflictNotes || '';
        document.getElementById('knowledgeStructuredData').value = entry.structuredData ? JSON.stringify(entry.structuredData, null, 2) : '';
        document.getElementById('knowledgeTags').value = (entry.tags || []).join(', ');
        document.getElementById('knowledgeSource').value = entry.source || 'ADMIN_VERIFIED';
        document.getElementById('knowledgeSourceUrl').value = entry.sourceUrl || '';
        document.getElementById('knowledgeFormTitle').textContent = 'Edit Knowledge Entry';
        document.getElementById('knowledgeSubmitBtn').textContent = 'Save Changes';
        document.getElementById('knowledgeCancelBtn').style.display = 'block';
        clearAlert();
        document.getElementById('knowledgeTitle').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    async function verifyEntry(id) {
        try {
            await AdminAuth.authFetch(`/api/knowledge/${id}/verify`, { method: 'POST' });
            await Promise.all([loadEntries(), loadAttention()]);
        } catch (error) {
            showAlert(error.message, 'error');
        }
    }

    async function disableEntry(id) {
        if (!confirm('Disable this entry? The chatbot will stop retrieving it.')) return;
        try {
            await AdminAuth.authFetch(`/api/knowledge/${id}/disable`, { method: 'POST' });
            await Promise.all([loadEntries(), loadAttention()]);
        } catch (error) {
            showAlert(error.message, 'error');
        }
    }

    async function deleteEntry(id) {
        if (!confirm('Permanently delete this knowledge entry?')) return;
        try {
            const res = await AdminAuth.authFetch(`/api/knowledge/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete entry');
            }
            await Promise.all([loadEntries(), loadAttention()]);
        } catch (error) {
            showAlert(error.message, 'error');
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        clearAlert();

        let structuredData;
        const rawStructured = document.getElementById('knowledgeStructuredData').value.trim();
        if (rawStructured) {
            try {
                structuredData = JSON.parse(rawStructured);
            } catch (err) {
                showAlert('Structured data must be valid JSON.', 'error');
                return;
            }
        }

        const payload = {
            key: document.getElementById('knowledgeKey').value.trim() || undefined,
            title: document.getElementById('knowledgeTitle').value.trim(),
            category: document.getElementById('knowledgeCategory').value,
            content: document.getElementById('knowledgeContent').value.trim(),
            status: document.getElementById('knowledgeStatus').value,
            conflictNotes: document.getElementById('knowledgeConflictNotes').value.trim() || undefined,
            structuredData,
            tags: document.getElementById('knowledgeTags').value.split(',').map(t => t.trim()).filter(Boolean),
            source: document.getElementById('knowledgeSource').value,
            sourceUrl: document.getElementById('knowledgeSourceUrl').value.trim() || undefined
        };

        const isEdit = Boolean(editingId);
        const url = isEdit ? `/api/knowledge/${editingId}` : '/api/knowledge';
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const res = await AdminAuth.authFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || (data.errors && data.errors[0] && data.errors[0].msg) || 'Failed to save entry');
            }

            showAlert(isEdit ? 'Entry updated.' : 'Entry added.', 'success');
            resetForm();
            await Promise.all([loadEntries(), loadAttention()]);
        } catch (error) {
            showAlert(error.message, 'error');
        }
    }

    function populateCategoryFilter() {
        const select = document.getElementById('knowledgeCategoryFilter');
        const categories = ['CHURCH_INFORMATION', 'CONTACT', 'SOCIAL_MEDIA', 'WORSHIP_SCHEDULE', 'LEADERSHIP', 'MISSION', 'VISION', 'VALUES', 'BELIEFS', 'MINISTRY', 'DONATION', 'EVENT', 'LIVESTREAM', 'FAQ', 'OTHER'];
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat.replace(/_/g, ' ');
            select.appendChild(opt);
        });
    }

    function init() {
        populateCategoryFilter();
        document.getElementById('knowledgeForm').addEventListener('submit', handleSubmit);
        document.getElementById('knowledgeCancelBtn').addEventListener('click', () => {
            resetForm();
            clearAlert();
        });
        document.getElementById('knowledgeCategoryFilter').addEventListener('change', loadEntries);
        document.getElementById('knowledgeStatusFilter').addEventListener('change', loadEntries);
        loadEntries();
        loadAttention();
    }

    window.AdminKnowledge = { init };
})(window);
