(function (window) {
    const TOKEN_KEY = 'qcc_admin_token';
    const USER_KEY = 'qcc_admin_user';

    async function login(email, password) {
        const res = await fetch(apiUrl('/api/auth/login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || (data.errors && data.errors[0] && data.errors[0].msg) || 'Login failed');
        }

        if (!data.user || data.user.role !== 'admin') {
            throw new Error('This account does not have admin access');
        }

        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return data.user;
    }

    function getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    function getUser() {
        try {
            return JSON.parse(localStorage.getItem(USER_KEY));
        } catch (e) {
            return null;
        }
    }

    function clearSession() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }

    function goToLogin() {
        clearSession();
        window.location.href = 'admin-login.html';
    }

    async function authFetch(url, options) {
        const token = getToken();
        if (!token) {
            goToLogin();
            throw new Error('Not authenticated');
        }

        const opts = Object.assign({}, options);
        opts.headers = Object.assign({}, opts.headers, {
            Authorization: `Bearer ${token}`
        });

        const res = await fetch(apiUrl(url), opts);

        if (res.status === 401 || res.status === 403) {
            goToLogin();
            throw new Error('Session expired, please log in again');
        }

        return res;
    }

    // Runs on the dashboard page to verify the session before showing content.
    async function requireAdminAuth() {
        const token = getToken();
        if (!token) {
            goToLogin();
            return null;
        }

        try {
            const res = await fetch(apiUrl('/api/auth/me'), {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                goToLogin();
                return null;
            }

            const data = await res.json();
            if (!data.user || data.user.role !== 'admin') {
                goToLogin();
                return null;
            }

            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
            return data.user;
        } catch (e) {
            goToLogin();
            return null;
        }
    }

    async function logout() {
        try {
            await authFetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {
            // ignore network errors on logout
        }
        goToLogin();
    }

    window.AdminAuth = {
        login,
        logout,
        getToken,
        getUser,
        authFetch,
        requireAdminAuth
    };
})(window);
