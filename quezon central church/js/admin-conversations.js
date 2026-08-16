(function (window) {
    let openConversationId = null;

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    function showAlert(message, type) {
        document.getElementById('conversationsAlert').innerHTML =
            `<div class="admin-alert admin-alert-${type}">${message}</div>`;
    }

    function formatDate(dateStr) {
        return new Date(dateStr).toLocaleString();
    }

    function statusBadgeClass(status) {
        if (status === 'AI_HANDLED') return '';
        if (status === 'RESOLVED') return ' admin-badge-inactive';
        return ' admin-badge-warning';
    }

    function renderList(conversations) {
        const container = document.getElementById('conversationsList');

        if (!conversations.length) {
            container.innerHTML = '<div class="admin-empty-state">No conversations yet.</div>';
            return;
        }

        container.innerHTML = conversations.map(conv => `
            <div class="admin-item-row">
                <div>
                    <p class="admin-item-title">
                        <span class="admin-badge${statusBadgeClass(conv.status)}">${conv.status.replace(/_/g, ' ')}</span>
                        ${conv.lastIntent ? `<span class="admin-badge admin-badge-inactive">${escapeHtml(conv.lastIntent)}</span>` : ''}
                        ${escapeHtml(conv.conversationId.slice(0, 8))}…
                    </p>
                    <p class="admin-item-meta">Last activity: ${formatDate(conv.updatedAt)}${conv.contactRequestId ? ' · has a linked contact request' : ''}</p>
                </div>
                <div class="admin-item-actions">
                    <button class="admin-btn-small" data-view="${conv.conversationId}">View</button>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('[data-view]').forEach(btn => {
            btn.addEventListener('click', () => viewConversation(btn.dataset.view));
        });
    }

    async function viewConversation(conversationId) {
        openConversationId = conversationId;
        const detail = document.getElementById('conversationDetail');
        detail.innerHTML = '<div class="admin-empty-state">Loading…</div>';

        try {
            const res = await AdminAuth.authFetch(`/api/conversations/${conversationId}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load conversation');

            const conv = data.conversation;
            detail.innerHTML = `
                <div class="admin-form-card" style="margin-top:1rem;">
                    <h3>Conversation ${escapeHtml(conversationId.slice(0, 8))}…</h3>
                    <div style="max-height:320px; overflow-y:auto; border:1px solid #e5e7eb; border-radius:0.5rem; padding:0.75rem; margin-bottom:0.75rem;">
                        ${(conv.messages || []).map(m => `
                            <div style="margin-bottom:0.6rem;">
                                <strong>${m.role === 'user' ? 'Visitor' : 'AI'}${m.intent ? ' (' + escapeHtml(m.intent) + ')' : ''}:</strong>
                                <span style="white-space:pre-wrap;">${escapeHtml(m.content)}</span>
                            </div>
                        `).join('') || '<p class="admin-empty-state">No messages recorded.</p>'}
                    </div>
                    <div class="form-group">
                        <label for="convStatus">Status</label>
                        <select id="convStatus">
                            ${['AI_HANDLED', 'NEEDS_HUMAN', 'CONTACT_REQUESTED', 'CONTACTED', 'RESOLVED'].map(s =>
                                `<option value="${s}" ${conv.status === s ? 'selected' : ''}>${s.replace(/_/g, ' ')}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <button type="button" class="admin-btn-small" id="convSaveStatusBtn">Save Status</button>
                    <button type="button" class="admin-btn-small" id="convCloseBtn">Close</button>
                </div>
            `;

            document.getElementById('convSaveStatusBtn').addEventListener('click', () => saveStatus(conversationId));
            document.getElementById('convCloseBtn').addEventListener('click', () => {
                openConversationId = null;
                detail.innerHTML = '';
            });
        } catch (error) {
            detail.innerHTML = `<div class="admin-empty-state">${error.message}</div>`;
        }
    }

    async function saveStatus(conversationId) {
        const status = document.getElementById('convStatus').value;
        try {
            const res = await AdminAuth.authFetch(`/api/conversations/${conversationId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update conversation');

            showAlert('Conversation updated.', 'success');
            await loadConversations();
        } catch (error) {
            showAlert(error.message, 'error');
        }
    }

    async function loadConversations() {
        const status = document.getElementById('conversationsStatusFilter').value;
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        params.set('limit', '50');

        try {
            const res = await AdminAuth.authFetch(`/api/conversations?${params.toString()}`);
            const data = await res.json();
            renderList(data.conversations || []);
        } catch (error) {
            document.getElementById('conversationsList').innerHTML =
                `<div class="admin-empty-state">${error.message}</div>`;
        }
    }

    function init() {
        document.getElementById('conversationsStatusFilter').addEventListener('change', loadConversations);
        loadConversations();
    }

    window.AdminConversations = { init };
})(window);
