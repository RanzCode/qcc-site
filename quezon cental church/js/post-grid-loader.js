document.addEventListener('DOMContentLoaded', async function () {
    const grid = document.getElementById('post-grid');
    if (!grid) return;

    try {
        const res = await fetch('/api/posts');
        const data = await res.json();
        const posts = data.posts || [];

        if (!posts.length) {
            grid.innerHTML = '';
            return;
        }

        grid.innerHTML = posts.map(post => `
            <iframe src="${post.embedUrl}" width="500" height="590"
                style="border:none;overflow:hidden;width:100%;height:100%;"
                scrolling="no" frameborder="0" allowfullscreen="true"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>
        `).join('');
    } catch (error) {
        console.error('Failed to load post grid:', error);
    }
});
