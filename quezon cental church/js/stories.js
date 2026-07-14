(function () {
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    function getInitials(name) {
        return (name || '')
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(part => part.charAt(0).toUpperCase())
            .join('') || '?';
    }

    function renderStories(stories) {
        const grid = document.getElementById('storiesGrid');
        if (!grid) return;

        if (!stories.length) {
            grid.innerHTML = '<p class="testimonials-empty">Be the first to share a stewardship story!</p>';
            return;
        }

        grid.innerHTML = stories.map(story => `
            <div class="testimonial-card">
                <div class="testimonial-header">
                    <div class="testimonial-avatar">${escapeHtml(getInitials(story.name))}</div>
                    <div class="testimonial-info">
                        <h4>${escapeHtml(story.name)}</h4>
                        <p>Church Member</p>
                    </div>
                </div>
                <p class="testimonial-text">"${escapeHtml(story.message)}"</p>
            </div>
        `).join('');
    }

    async function loadStories() {
        const grid = document.getElementById('storiesGrid');
        if (!grid) return;

        try {
            const res = await fetch(apiUrl('/api/stories'));
            const data = await res.json();
            renderStories(data.stories || []);
        } catch (error) {
            console.error('Error loading stories:', error);
            grid.innerHTML = '<p class="testimonials-empty">Unable to load stories right now.</p>';
        }
    }

    function showAlert(message, type) {
        const alertBox = document.getElementById('storyAlert');
        if (alertBox) {
            alertBox.innerHTML = `<div class="story-alert story-alert-${type}">${escapeHtml(message)}</div>`;
        }
    }

    function initForm() {
        const form = document.getElementById('storyForm');
        if (!form) return;

        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            const name = document.getElementById('storyName').value.trim();
            const message = document.getElementById('storyMessage').value.trim();

            try {
                const res = await fetch(apiUrl('/api/stories'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, message })
                });
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || (data.errors && data.errors[0] && data.errors[0].msg) || 'Failed to submit story');
                }

                showAlert('Thank you for sharing your story!', 'success');
                form.reset();
                await loadStories();
            } catch (error) {
                showAlert(error.message, 'error');
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        loadStories();
        initForm();
    });
})();
