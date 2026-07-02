(function (window) {
    let editingId = null;

    function showAlert(message, type) {
        document.getElementById('sermonsAlert').innerHTML =
            `<div class="admin-alert admin-alert-${type}">${message}</div>`;
    }

    function clearAlert() {
        document.getElementById('sermonsAlert').innerHTML = '';
    }

    function resetForm() {
        editingId = null;
        document.getElementById('sermonId').value = '';
        document.getElementById('sermonTitle').value = '';
        document.getElementById('sermonPreacher').value = '';
        document.getElementById('sermonDate').value = '';
        document.getElementById('sermonScripture').value = '';
        document.getElementById('sermonDescription').value = '';
        document.getElementById('sermonVideoUrl').value = '';
        document.getElementById('sermonStatus').value = 'published';
        document.getElementById('sermonFeatured').checked = false;
        document.getElementById('sermonsFormTitle').textContent = 'Add Sermon';
        document.getElementById('sermonsSubmitBtn').textContent = 'Add Sermon';
        document.getElementById('sermonsCancelBtn').style.display = 'none';
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    function renderList(sermons) {
        const container = document.getElementById('sermonsList');

        if (!sermons.length) {
            container.innerHTML = '<div class="admin-empty-state">No sermons yet.</div>';
            return;
        }

        container.innerHTML = sermons.map(sermon => `
            <div class="admin-item-row">
                <div>
                    <p class="admin-item-title">
                        <span class="admin-badge${sermon.status === 'published' ? '' : ' admin-badge-inactive'}">${sermon.status}</span>
                        ${escapeHtml(sermon.title)}
                    </p>
                    <p class="admin-item-meta">${escapeHtml(sermon.preacher)} — ${new Date(sermon.date).toLocaleDateString()}</p>
                </div>
                <div class="admin-item-actions">
                    <button class="admin-btn-small" data-edit="${sermon._id}">Edit</button>
                    <button class="admin-btn-small admin-btn-danger" data-delete="${sermon._id}">Delete</button>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', () => editSermon(btn.dataset.edit, sermons));
        });
        container.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', () => deleteSermon(btn.dataset.delete));
        });
    }

    async function loadSermons() {
        try {
            const res = await AdminAuth.authFetch('/api/sermons/admin/all?limit=100');
            const data = await res.json();
            renderList(data.sermons || []);
        } catch (error) {
            document.getElementById('sermonsList').innerHTML =
                `<div class="admin-empty-state">${error.message}</div>`;
        }
    }

    function editSermon(id, sermons) {
        const sermon = sermons.find(s => s._id === id);
        if (!sermon) return;

        editingId = id;
        document.getElementById('sermonId').value = id;
        document.getElementById('sermonTitle').value = sermon.title || '';
        document.getElementById('sermonPreacher').value = sermon.preacher || '';
        document.getElementById('sermonDate').value = sermon.date ? sermon.date.slice(0, 10) : '';
        document.getElementById('sermonScripture').value = sermon.scripture || '';
        document.getElementById('sermonDescription').value = sermon.description || '';
        document.getElementById('sermonVideoUrl').value = sermon.videoUrl || '';
        document.getElementById('sermonStatus').value = sermon.status || 'published';
        document.getElementById('sermonFeatured').checked = Boolean(sermon.isFeatured);
        document.getElementById('sermonsFormTitle').textContent = 'Edit Sermon';
        document.getElementById('sermonsSubmitBtn').textContent = 'Save Changes';
        document.getElementById('sermonsCancelBtn').style.display = 'block';
        clearAlert();
    }

    async function deleteSermon(id) {
        if (!confirm('Delete this sermon?')) return;

        try {
            const res = await AdminAuth.authFetch(`/api/sermons/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete sermon');
            }
            await loadSermons();
        } catch (error) {
            showAlert(error.message, 'error');
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        clearAlert();

        const payload = {
            title: document.getElementById('sermonTitle').value.trim(),
            preacher: document.getElementById('sermonPreacher').value.trim(),
            date: document.getElementById('sermonDate').value,
            scripture: document.getElementById('sermonScripture').value.trim(),
            description: document.getElementById('sermonDescription').value.trim(),
            videoUrl: document.getElementById('sermonVideoUrl').value.trim(),
            status: document.getElementById('sermonStatus').value,
            isFeatured: document.getElementById('sermonFeatured').checked
        };

        const isEdit = Boolean(editingId);
        const url = isEdit ? `/api/sermons/${editingId}` : '/api/sermons';
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const res = await AdminAuth.authFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || (data.errors && data.errors[0] && data.errors[0].msg) || 'Failed to save sermon');
            }

            showAlert(isEdit ? 'Sermon updated.' : 'Sermon added.', 'success');
            resetForm();
            await loadSermons();
        } catch (error) {
            showAlert(error.message, 'error');
        }
    }

    function init() {
        document.getElementById('sermonsForm').addEventListener('submit', handleSubmit);
        document.getElementById('sermonsCancelBtn').addEventListener('click', () => {
            resetForm();
            clearAlert();
        });
        loadSermons();
    }

    window.AdminSermons = { init };
})(window);
