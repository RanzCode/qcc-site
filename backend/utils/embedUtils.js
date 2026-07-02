// Detects the platform (youtube/facebook/instagram) of a raw post/video URL
// and builds a ready-to-embed iframe URL for it.
function detectPlatform(url) {
    if (!url || typeof url !== 'string') {
        return { platform: 'unknown', embedUrl: null };
    }

    let parsed;
    try {
        parsed = new URL(url.trim());
    } catch (e) {
        return { platform: 'unknown', embedUrl: null };
    }

    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

    // YouTube
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be') {
        let videoId = null;

        if (host === 'youtu.be') {
            videoId = parsed.pathname.split('/').filter(Boolean)[0] || null;
        } else if (parsed.searchParams.get('v')) {
            videoId = parsed.searchParams.get('v');
        } else {
            const match = parsed.pathname.match(/\/(shorts|live|embed)\/([^/?]+)/);
            if (match) videoId = match[2];
        }

        if (!videoId) return { platform: 'youtube', embedUrl: null };
        return {
            platform: 'youtube',
            embedUrl: `https://www.youtube.com/embed/${videoId}`
        };
    }

    // Facebook
    if (host === 'facebook.com' || host === 'fb.watch') {
        const isVideo = /\/videos\//.test(parsed.pathname) || parsed.pathname.includes('/watch') || host === 'fb.watch';
        const encoded = encodeURIComponent(url.trim());
        return {
            platform: 'facebook',
            embedUrl: isVideo
                ? `https://www.facebook.com/plugins/video.php?href=${encoded}&show_text=false&width=500`
                : `https://www.facebook.com/plugins/post.php?href=${encoded}&show_text=true&width=500`
        };
    }

    // Instagram
    if (host === 'instagram.com') {
        const match = parsed.pathname.match(/\/(p|reel|tv)\/([^/?]+)/);
        if (!match) return { platform: 'instagram', embedUrl: null };
        return {
            platform: 'instagram',
            embedUrl: `https://www.instagram.com/${match[1]}/${match[2]}/embed`
        };
    }

    return { platform: 'unknown', embedUrl: null };
}

// Normalizes a Google Slides share/edit/embed link into a ready-to-embed URL.
function normalizeGoogleSlidesUrl(url) {
    if (!url || typeof url !== 'string') return null;

    const match = url.trim().match(/\/presentation\/d\/(e\/)?([a-zA-Z0-9_-]+)/);
    if (!match) return null;

    const [, publishedPrefix, id] = match;
    const base = publishedPrefix
        ? `https://docs.google.com/presentation/d/e/${id}/pubembed`
        : `https://docs.google.com/presentation/d/${id}/embed`;

    return `${base}?start=false&loop=false&delayms=3000`;
}

module.exports = { detectPlatform, normalizeGoogleSlidesUrl };
