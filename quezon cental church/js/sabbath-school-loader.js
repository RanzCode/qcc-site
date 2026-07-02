document.addEventListener('DOMContentLoaded', async function () {
    const grid = document.getElementById('sabbath-school-slides-grid');
    if (!grid) return;

    try {
        const res = await fetch('/api/sabbath-school');
        const data = await res.json();
        const lessons = data.lessons || [];

        if (!lessons.length) {
            grid.innerHTML = '';
            return;
        }

        grid.innerHTML = lessons.map(lesson => `
            <div class="embed-item" style="position:relative;padding-bottom:57.6%;height:0;overflow:hidden;">
                <iframe src="${lesson.embedUrl}" frameborder="0" allowfullscreen="true"
                    mozallowfullscreen="true" webkitallowfullscreen="true"
                    style="border:0;position:absolute;top:0;left:0;width:100%;height:100%;"></iframe>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load Sabbath School slides:', error);
    }
});
