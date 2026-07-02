(function (window) {
    let editingId = null;

    function showAlert(message, type) {
        document.getElementById('slidesAlert').innerHTML =
            `<div class="admin-alert admin-alert-${type}">${message}</div>`;
    }

    function clearAlert() {
        document.getElementById('slidesAlert').innerHTML = '';
    }

    function resetForm() {
        editingId = null;
        document.getElementById('slideId').value = '';
        document.getElementById('slideUrl').value = '';
        document.getElementById('slideTitle').value = '';
        document.getElementById('slideOrder').value = '0';
        document.getElementById('slideActive').checked = true;
        document.getElementById('slidesFormTitle').textContent = 'Add Slide';
        document.getElementById('slidesSubmitBtn').textContent = 'Add Slide';
        document.getElementById('slidesCancelBtn').style.display = 'none';
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    function renderList(lessons) {
        const container = document.getElementById('slidesList');

        if (!lessons.length) {
            container.innerHTML = '<div class="admin-empty-state">No slides yet.</div>';
            return;
        }

        container.innerHTML = lessons.map(lesson => `
            <div class="admin-item-row">
                <div>
                    <p class="admin-item-title">
                        <span class="admin-badge${lesson.isActive ? '' : ' admin-badge-inactive'}">order ${lesson.order || 0}</span>
                        ${escapeHtml(lesson.title || 'Sabbath School Lesson')}
                    </p>
                    <p class="admin-item-meta">${escapeHtml(lesson.slideUrl)}</p>
                </div>
                <div class="admin-item-actions">
                    <button class="admin-btn-small" data-edit="${lesson._id}">Edit</button>
                    <button class="admin-btn-small admin-btn-danger" data-delete="${lesson._id}">Delete</button>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', () => editLesson(btn.dataset.edit, lessons));
        });
        container.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', () => deleteLesson(btn.dataset.delete));
        });
    }

    async function loadLessons() {
        try {
            const res = await AdminAuth.authFetch('/api/sabbath-school/admin/all');
            const data = await res.json();
            renderList(data.lessons || []);
        } catch (error) {
            document.getElementById('slidesList').innerHTML =
                `<div class="admin-empty-state">${error.message}</div>`;
        }
    }

    function editLesson(id, lessons) {
        const lesson = lessons.find(l => l._id === id);
        if (!lesson) return;

        editingId = id;
        document.getElementById('slideId').value = id;
        document.getElementById('slideUrl').value = lesson.slideUrl;
        document.getElementById('slideTitle').value = lesson.title || '';
        document.getElementById('slideOrder').value = lesson.order || 0;
        document.getElementById('slideActive').checked = lesson.isActive;
        document.getElementById('slidesFormTitle').textContent = 'Edit Slide';
        document.getElementById('slidesSubmitBtn').textContent = 'Save Changes';
        document.getElementById('slidesCancelBtn').style.display = 'block';
        clearAlert();
    }

    async function deleteLesson(id) {
        if (!confirm('Delete this slide?')) return;

        try {
            const res = await AdminAuth.authFetch(`/api/sabbath-school/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete slide');
            }
            await loadLessons();
        } catch (error) {
            showAlert(error.message, 'error');
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        clearAlert();

        const payload = {
            slideUrl: document.getElementById('slideUrl').value.trim(),
            title: document.getElementById('slideTitle').value.trim(),
            order: Number(document.getElementById('slideOrder').value) || 0,
            isActive: document.getElementById('slideActive').checked
        };

        const isEdit = Boolean(editingId);
        const url = isEdit ? `/api/sabbath-school/${editingId}` : '/api/sabbath-school';
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const res = await AdminAuth.authFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || (data.errors && data.errors[0] && data.errors[0].msg) || 'Failed to save slide');
            }

            showAlert(isEdit ? 'Slide updated.' : 'Slide added.', 'success');
            resetForm();
            await loadLessons();
        } catch (error) {
            showAlert(error.message, 'error');
        }
    }

    function init() {
        document.getElementById('slidesForm').addEventListener('submit', handleSubmit);
        document.getElementById('slidesCancelBtn').addEventListener('click', () => {
            resetForm();
            clearAlert();
        });
        loadLessons();
    }

    window.AdminSabbathSchool = { init };
})(window);
