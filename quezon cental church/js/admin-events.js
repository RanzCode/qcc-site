(function (window) {
    // Must match the data-event-title attributes on the cards in events.html
    const EVENT_TITLES = [
        'Community Outreach Program',
        'Youth Fellowship',
        'Midweek Bible Study',
        'Prayer Meeting',
        'Church Family Day',
        'Health & Wellness Seminar'
    ];

    function showAlert(message, type) {
        document.getElementById('eventsAlert').innerHTML =
            `<div class="admin-alert admin-alert-${type}">${message}</div>`;
    }

    function clearAlert() {
        document.getElementById('eventsAlert').innerHTML = '';
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    function resetForm() {
        document.getElementById('eventTitleSelect').value = '';
        document.getElementById('eventFacebookUrl').value = '';
    }

    function renderList(links) {
        const container = document.getElementById('eventsList');
        const linkByTitle = {};
        links.forEach(link => { linkByTitle[link.eventTitle] = link; });

        container.innerHTML = EVENT_TITLES.map(title => {
            const link = linkByTitle[title];
            return `
                <div class="admin-item-row">
                    <div>
                        <p class="admin-item-title">
                            <span class="admin-badge${link ? '' : ' admin-badge-inactive'}">${link ? 'Linked' : 'Not linked'}</span>
                            ${escapeHtml(title)}
                        </p>
                        <p class="admin-item-meta">${link ? escapeHtml(link.facebookUrl) : 'No Facebook link set yet — the "View Details" button stays disabled on the site.'}</p>
                    </div>
                    <div class="admin-item-actions">
                        <button class="admin-btn-small" data-edit="${escapeHtml(title)}">${link ? 'Edit' : 'Add link'}</button>
                        ${link ? `<button class="admin-btn-small admin-btn-danger" data-delete="${link._id}">Remove</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        container.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', () => editLink(btn.dataset.edit, linkByTitle));
        });
        container.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', () => deleteLink(btn.dataset.delete));
        });
    }

    function editLink(title, linkByTitle) {
        const link = linkByTitle[title];
        document.getElementById('eventTitleSelect').value = title;
        document.getElementById('eventFacebookUrl').value = link ? link.facebookUrl : '';
        clearAlert();
        document.getElementById('eventFacebookUrl').focus();
    }

    async function loadLinks() {
        try {
            const res = await fetch('/api/event-links');
            const data = await res.json();
            renderList(data.links || []);
        } catch (error) {
            document.getElementById('eventsList').innerHTML =
                `<div class="admin-empty-state">${error.message}</div>`;
        }
    }

    async function deleteLink(id) {
        if (!confirm('Remove this event link? The "View Details" button will go back to disabled on the site.')) return;

        try {
            const res = await AdminAuth.authFetch(`/api/event-links/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to remove link');
            }
            await loadLinks();
        } catch (error) {
            showAlert(error.message, 'error');
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        clearAlert();

        const payload = {
            eventTitle: document.getElementById('eventTitleSelect').value,
            facebookUrl: document.getElementById('eventFacebookUrl').value.trim()
        };

        if (!payload.eventTitle) {
            showAlert('Choose which event card this link is for.', 'error');
            return;
        }

        try {
            const res = await AdminAuth.authFetch('/api/event-links', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || (data.errors && data.errors[0] && data.errors[0].msg) || 'Failed to save link');
            }

            showAlert('Event link saved.', 'success');
            resetForm();
            await loadLinks();
        } catch (error) {
            showAlert(error.message, 'error');
        }
    }

    // --- Featured Event (Annual Church Camp) ---

    function showFeaturedAlert(message, type) {
        document.getElementById('featuredEventAlert').innerHTML =
            `<div class="admin-alert admin-alert-${type}">${message}</div>`;
    }

    function toDateInputValue(dateString) {
        if (!dateString) return '';
        return new Date(dateString).toISOString().slice(0, 10);
    }

    async function loadFeaturedEvent() {
        try {
            const res = await fetch('/api/featured-event');
            const data = await res.json();
            const featuredEvent = data.featuredEvent;
            if (!featuredEvent) return;

            document.getElementById('featuredStartDate').value = toDateInputValue(featuredEvent.startDate);
            document.getElementById('featuredEndDate').value = toDateInputValue(featuredEvent.endDate);
            document.getElementById('featuredViewDetailsUrl').value = featuredEvent.viewDetailsUrl || '';
            document.getElementById('featuredRegisterUrl').value = featuredEvent.registerUrl || '';
        } catch (error) {
            showFeaturedAlert(error.message, 'error');
        }
    }

    async function handleFeaturedEventSubmit(e) {
        e.preventDefault();
        document.getElementById('featuredEventAlert').innerHTML = '';

        const payload = {
            startDate: document.getElementById('featuredStartDate').value,
            endDate: document.getElementById('featuredEndDate').value,
            viewDetailsUrl: document.getElementById('featuredViewDetailsUrl').value.trim(),
            registerUrl: document.getElementById('featuredRegisterUrl').value.trim()
        };

        try {
            const res = await AdminAuth.authFetch('/api/featured-event', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || (data.errors && data.errors[0] && data.errors[0].msg) || 'Failed to save featured event');
            }

            showFeaturedAlert('Featured event saved.', 'success');
        } catch (error) {
            showFeaturedAlert(error.message, 'error');
        }
    }

    function init() {
        document.getElementById('eventsForm').addEventListener('submit', handleSubmit);
        document.getElementById('featuredEventForm').addEventListener('submit', handleFeaturedEventSubmit);
        loadLinks();
        loadFeaturedEvent();
    }

    window.AdminEvents = { init };
})(window);
