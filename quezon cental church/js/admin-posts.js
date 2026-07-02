(function (window) {
    let editingId = null;

    function showAlert(message, type) {
        document.getElementById('postsAlert').innerHTML =
            `<div class="admin-alert admin-alert-${type}">${message}</div>`;
    }

    function clearAlert() {
        document.getElementById('postsAlert').innerHTML = '';
    }

    function resetForm() {
        editingId = null;
        document.getElementById('postId').value = '';
        document.getElementById('postUrl').value = '';
        document.getElementById('postTitle').value = '';
        document.getElementById('postOrder').value = '0';
        document.getElementById('postActive').checked = true;
        document.getElementById('postsFormTitle').textContent = 'Add Post';
        document.getElementById('postsSubmitBtn').textContent = 'Add Post';
        document.getElementById('postsCancelBtn').style.display = 'none';
    }

    function renderList(posts) {
        const container = document.getElementById('postsList');

        if (!posts.length) {
            container.innerHTML = '<div class="admin-empty-state">No posts yet.</div>';
            return;
        }

        container.innerHTML = posts.map(post => `
            <div class="admin-item-row">
                <div>
                    <p class="admin-item-title">
                        <span class="admin-badge${post.isActive ? '' : ' admin-badge-inactive'}">${post.platform}</span>
                        ${post.title ? escapeHtml(post.title) : escapeHtml(post.url)}
                    </p>
                    <p class="admin-item-meta">${escapeHtml(post.url)}</p>
                </div>
                <div class="admin-item-actions">
                    <button class="admin-btn-small" data-edit="${post._id}">Edit</button>
                    <button class="admin-btn-small admin-btn-danger" data-delete="${post._id}">Delete</button>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', () => editPost(btn.dataset.edit, posts));
        });
        container.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', () => deletePost(btn.dataset.delete));
        });
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    async function loadPosts() {
        try {
            const res = await AdminAuth.authFetch('/api/posts/admin/all');
            const data = await res.json();
            renderList(data.posts || []);
        } catch (error) {
            document.getElementById('postsList').innerHTML =
                `<div class="admin-empty-state">${error.message}</div>`;
        }
    }

    function editPost(id, posts) {
        const post = posts.find(p => p._id === id);
        if (!post) return;

        editingId = id;
        document.getElementById('postId').value = id;
        document.getElementById('postUrl').value = post.url;
        document.getElementById('postTitle').value = post.title || '';
        document.getElementById('postOrder').value = post.order || 0;
        document.getElementById('postActive').checked = post.isActive;
        document.getElementById('postsFormTitle').textContent = 'Edit Post';
        document.getElementById('postsSubmitBtn').textContent = 'Save Changes';
        document.getElementById('postsCancelBtn').style.display = 'block';
        clearAlert();
    }

    async function deletePost(id) {
        if (!confirm('Delete this post?')) return;

        try {
            const res = await AdminAuth.authFetch(`/api/posts/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete post');
            }
            await loadPosts();
        } catch (error) {
            showAlert(error.message, 'error');
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        clearAlert();

        const payload = {
            url: document.getElementById('postUrl').value.trim(),
            title: document.getElementById('postTitle').value.trim(),
            order: Number(document.getElementById('postOrder').value) || 0,
            isActive: document.getElementById('postActive').checked
        };

        const isEdit = Boolean(editingId);
        const url = isEdit ? `/api/posts/${editingId}` : '/api/posts';
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const res = await AdminAuth.authFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || (data.errors && data.errors[0] && data.errors[0].msg) || 'Failed to save post');
            }

            showAlert(isEdit ? 'Post updated.' : 'Post added.', 'success');
            resetForm();
            await loadPosts();
        } catch (error) {
            showAlert(error.message, 'error');
        }
    }

    function init() {
        document.getElementById('postsForm').addEventListener('submit', handleSubmit);
        document.getElementById('postsCancelBtn').addEventListener('click', () => {
            resetForm();
            clearAlert();
        });
        loadPosts();
    }

    window.AdminPosts = { init };
})(window);
