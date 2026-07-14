(function (window) {
    function showAlert(message, type) {
        document.getElementById('storiesAlert').innerHTML =
            `<div class="admin-alert admin-alert-${type}">${message}</div>`;
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    function renderList(stories) {
        const container = document.getElementById('storiesList');

        if (!stories.length) {
            container.innerHTML = '<div class="admin-empty-state">No stories submitted yet.</div>';
            return;
        }

        container.innerHTML = stories.map(story => `
            <div class="admin-item-row">
                <div>
                    <p class="admin-item-title">${escapeHtml(story.name)}</p>
                    <p class="admin-item-meta">${escapeHtml(story.message)}</p>
                </div>
                <div class="admin-item-actions">
                    <button class="admin-btn-small admin-btn-danger" data-delete="${story._id}">Delete</button>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', () => deleteStory(btn.dataset.delete));
        });
    }

    async function loadStories() {
        try {
            const res = await AdminAuth.authFetch('/api/stories');
            const data = await res.json();
            renderList(data.stories || []);
        } catch (error) {
            document.getElementById('storiesList').innerHTML =
                `<div class="admin-empty-state">${error.message}</div>`;
        }
    }

    async function deleteStory(id) {
        if (!confirm('Delete this story? It will no longer be visible on the Donate page.')) return;

        try {
            const res = await AdminAuth.authFetch(`/api/stories/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete story');
            }
            await loadStories();
        } catch (error) {
            showAlert(error.message, 'error');
        }
    }

    function init() {
        loadStories();
    }

    window.AdminStories = { init };
})(window);
