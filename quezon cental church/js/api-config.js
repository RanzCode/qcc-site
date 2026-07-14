// Resolves the backend API base URL depending on where the site is running.
// Local dev (served from localhost/127.0.0.1) -> local backend on port 3001.
// Everything else (qccqonnect.org on Cloudflare Pages) -> the production API on Render.
(function (window) {
    var host = window.location.hostname;
    var isLocal = host === 'localhost' || host === '127.0.0.1' || host === '';

    window.API_BASE_URL = isLocal
        ? 'http://localhost:3001'
        : 'https://api.qccqonnect.org';

    window.apiUrl = function (path) {
        return window.API_BASE_URL + path;
    };
})(window);
