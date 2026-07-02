// Fetch YouTube playlist items and render them in the Music Media subsection (music-media-grid)
async function fetchMusicMediaPlaylistItems() {
  const API_URL = "https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=PL676CTzKxGm4Xu8H_ZLvVpB9W3ny454s7&key=AIzaSyB8DeJQCLlcnhyICxknGGhQojpmqvjbKII";
  const musicGrid = document.getElementById('music-media-grid');
  if (!musicGrid) return;
  musicGrid.innerHTML = '<div class="loading-message">Loading videos...</div>';
  try {
    const res = await fetch(API_URL);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    if (!data.items || data.items.length === 0) {
      throw new Error('No videos found');
    }
    
    musicGrid.innerHTML = '';
    data.items.forEach((el) => {
      if (el.snippet && el.snippet.resourceId && el.snippet.resourceId.videoId) {
        const videoId = el.snippet.resourceId.videoId;
        const title = el.snippet.title || 'Untitled Video';
        
        const card = document.createElement('div');
        card.className = 'yt-video';
        card.setAttribute('data-video-id', videoId);
        card.setAttribute('data-yt-link', `https://www.youtube.com/watch?v=${videoId}`);
        
        card.innerHTML = `
          <iframe 
            src="https://www.youtube.com/embed/${videoId}?enablejsapi=1" 
            allowfullscreen
            loading="lazy"
          ></iframe>
          <h3>${title}</h3>
        `;
        musicGrid.appendChild(card);
      }
    });

    // Add mouseover/mouseout/click events for autoplay and navigation
    const videoDivs = musicGrid.querySelectorAll('.yt-video');
    let lastPlaying = null;
    videoDivs.forEach(div => {
      const iframe = div.querySelector('iframe');
      div.addEventListener('mouseenter', () => {
        if (lastPlaying && lastPlaying !== iframe) {
          lastPlaying.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        }
        iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        lastPlaying = iframe;
      });
      div.addEventListener('mouseleave', () => {
        iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
      });
      div.addEventListener('click', (e) => {
        if (e.target.tagName !== 'IFRAME') {
          window.open(div.getAttribute('data-yt-link'), '_blank');
        }
      });
    });
  } catch (err) {
    musicGrid.innerHTML = '<h3>Sorry, something went wrong. Try again later.</h3>';
    console.error(err);
  }
}
// Fetch YouTube playlist items and render them in the Sabbath School Lessons subsection (sabbath-school-grid)
async function fetchSabbathSchoolPlaylistItems() {
  const API_URL = "https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=PL615tmMR_c6X0KfJvu07enaghDhdgYRFe&key=AIzaSyB8DeJQCLlcnhyICxknGGhQojpmqvjbKII";
  const sabbathGrid = document.getElementById('sabbath-school-grid');
  if (!sabbathGrid) return;
  sabbathGrid.innerHTML = '<h3>Loading videos...</h3>';
  try {
    const res = await fetch(API_URL, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });
    const data = await res.json();
    sabbathGrid.innerHTML = '';
    data.items.forEach((el) => {
      sabbathGrid.innerHTML += `
        <div class="yt-video" data-video-id="${el.snippet.resourceId.videoId}" data-yt-link="https://www.youtube.com/watch?v=${el.snippet.resourceId.videoId}">
          <iframe src="https://www.youtube.com/embed/${el.snippet.resourceId.videoId}?enablejsapi=1" allowfullscreen></iframe>
          <h3>${el.snippet.title}</h3>
        </div>
      `;
    });

    // Add mouseover/mouseout/click events for autoplay and navigation
    const videoDivs = sabbathGrid.querySelectorAll('.yt-video');
    let lastPlaying = null;
    videoDivs.forEach(div => {
      const iframe = div.querySelector('iframe');
      div.addEventListener('mouseenter', () => {
        if (lastPlaying && lastPlaying !== iframe) {
          lastPlaying.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        }
        iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        lastPlaying = iframe;
      });
      div.addEventListener('mouseleave', () => {
        iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
      });
      div.addEventListener('click', (e) => {
        if (e.target.tagName !== 'IFRAME') {
          window.open(div.getAttribute('data-yt-link'), '_blank');
        }
      });
    });
  } catch (err) {
    sabbathGrid.innerHTML = '<h3>Sorry, something went wrong. Try again later.</h3>';
    console.error(err);
  }
}
// Mobile Menu Toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');

mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!mobileMenuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
        mobileMenu.classList.remove('active');
    }
});

// Chat Widget
const chatToggle = document.getElementById('chatToggle');
const chatWindow = document.getElementById('chatWindow');
const chatClose = document.getElementById('chatClose');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');

if (chatToggle) {
    chatToggle.addEventListener('click', () => {
        chatWindow.classList.toggle('active');
    });
}

if (chatClose) {
    chatClose.addEventListener('click', () => {
        chatWindow.classList.remove('active');
    });
}

let chatConversationId = null;
let chatIsSending = false;

if (chatForm) {
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const message = chatInput.value.trim();
        if (!message || chatIsSending) return;

        chatIsSending = true;
        chatInput.value = '';

        const timeString = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

        const userMessage = document.createElement('div');
        userMessage.className = 'message user-message';
        userMessage.innerHTML = `
            <div class="message-content">
                <p>${message}</p>
                <span class="message-time">${timeString}</span>
            </div>
        `;
        chatMessages.appendChild(userMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message church-message typing-indicator';
        typingIndicator.innerHTML = `
            <div class="message-content">
                <p><i class="fas fa-circle"></i><i class="fas fa-circle"></i><i class="fas fa-circle"></i></p>
            </div>
        `;
        chatMessages.appendChild(typingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        let replyText = 'Unable to connect to the server. Please make sure the backend is running and try again.';

        try {
            const response = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, conversationId: chatConversationId })
            });

            const data = await response.json();

            if (data.conversationId) chatConversationId = data.conversationId;
            if (data.message) replyText = data.message;

        } catch (error) {
            console.error('Chat error:', error);
        }

        chatMessages.removeChild(typingIndicator);

        const responseTime = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        const churchMessage = document.createElement('div');
        churchMessage.className = 'message church-message';
        churchMessage.innerHTML = `
            <div class="message-content">
                <p>${replyText}</p>
                <span class="message-time">${responseTime}</span>
            </div>
        `;
        chatMessages.appendChild(churchMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        chatIsSending = false;
    });
}

// Handle Enter key in chat input
if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatForm.dispatchEvent(new Event('submit'));
        }
    });
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});



// --- DYNAMIC CONTENT LOADING ---

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load all sections in parallel
        await Promise.all([
            loadEvents(),
            loadMedia(),
            loadDevotional(),
            initializeAnimations()
        ]);
        
        // Load the admin-managed sermon list wherever #sermons-grid exists
        // (Sermons page's "Recent Sermons" and Home's "Media Library" both use it)
        await loadSermonsPage();
    } catch (error) {
        console.error('Error initializing page:', error);
    }
});

function openForm(url) {
    window.open(url, '_blank');
}

// Intercept openForm to require login
const originalOpenForm = window.openForm;
window.openForm = function(url) {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        const loginModal = document.getElementById('loginModal');
        if (loginModal) loginModal.style.display = 'flex';
        return;
    }
    originalOpenForm(url);
};

// Placeholder data - replace with your API calls
const eventsData = [
    {
        imageUrl: 'https://via.placeholder.com/400x200/3B82F6/FFFFFF?text=Event+1',
        title: 'Community Outreach',
        description: 'Join us as we serve our local community.',
        buttonText: 'Register',
        formUrl: 'https://forms.gle/your-registration-form'
        
    },
    {
        imageUrl: 'https://via.placeholder.com/400x200/3B82F6/FFFFFF?text=Event+2',
        title: 'Youth Rally',
        description: 'A day of fun, fellowship, and spiritual growth for the youth.',
        buttonText: 'Register',
        formUrl: 'https://forms.gle/your-registration-form'
    },
    {
        imageUrl: 'https://via.placeholder.com/400x200/3B82F6/FFFFFF?text=Event+3',
        title: 'Vacation Bible School',
        description: 'Help us make this year\'s VBS a success for the kids!',
        buttonText: 'Volunteer Now',
        formUrl: 'https://forms.gle/your-volunteer-form'
    }
];

const sermonsData = Array(5).fill({
    imageUrl: 'https://via.placeholder.com/400x200/3B82F6/FFFFFF?text=Sermon',
    title: 'Walking in Faith',
    description: 'A powerful message on strengthening your faith.',
    videoUrl: 'https://www.youtube.com/watch?v=your-video-id'
});

const sabbathSchoolData = Array(5).fill({
    imageUrl: 'https://via.placeholder.com/400x200/3B82F6/FFFFFF?text=Sabbath+School',
    title: 'The Book of Romans',
    description: 'In-depth study of the weekly lesson.',
    videoUrl: 'https://www.youtube.com/watch?v=your-video-id'
});

const musicMediaData = Array(5).fill({
    imageUrl: 'https://via.placeholder.com/400x200/3B82F6/FFFFFF?text=Music',
    title: 'Hymns of Praise',
    description: 'Uplifting music from our talented worship team.',
    videoUrl: 'https://www.youtube.com/watch?v=your-video-id'
});

function loadEvents() {
    const eventsGrid = document.getElementById('events-grid');
    if (!eventsGrid) return;

    eventsGrid.innerHTML = '';
    eventsData.forEach(event => {
        const card = document.createElement('div');
        card.className = 'card event-card';
        card.innerHTML = `
            <img class="event-image" src="${event.imageUrl}" alt="${event.title}">
            <div class="event-content">
                <h3>${event.title}</h3>
                <p>${event.description}</p>
                <button class="btn btn-primary event-btn" onclick="openForm('${event.formUrl}')">${event.buttonText}</button>
            </div>
        `;
        eventsGrid.appendChild(card);
    });
}

async function loadMedia() {
    // Note: #sermons-grid is intentionally not handled here - it's owned by
    // loadSermonsPage() (DB-backed via /api/sermons) so Home and Sermons match.
    try {
        await Promise.all([
            fetchSabbathSchoolPlaylistItems(),
            fetchMusicMediaPlaylistItems()
        ]);
    } catch (error) {
        console.error('Error loading media:', error);
        // Fallback to sample data if API fails
        populateMediaGrid('sabbath-school-grid', sabbathSchoolData);
        populateMediaGrid('music-media-grid', musicMediaData);
    }
}

function populateMediaGrid(gridId, data) {
    const mediaGrid = document.getElementById(gridId);
    if (!mediaGrid) return;

    mediaGrid.innerHTML = '';
    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'media-card';
        card.innerHTML = `
            <a href="${item.videoUrl}" target="_blank" class="media-image">
                <img src="${item.imageUrl}" alt="${item.title}">
                <div class="media-overlay">
                    <i class="fab fa-youtube"></i>
                </div>
            </a>
            <div class="media-content">
                <h4 class="media-title">${item.title}</h4>
                <p class="media-description">${item.description}</p>
            </div>
        `;
        mediaGrid.appendChild(card);
    });

    // Add View Full Playlist card
    const playlistUrls = {
        'sermons-grid': 'https://www.youtube.com/watch?v=sPNG91LDuk8&list=PL615tmMR_c6UIx4yXrDinZCcfiS1BOTsV',
        'sabbath-school-grid': 'https://www.youtube.com/watch?v=61rrTBOoFcA&list=PL615tmMR_c6X0KfJvu07enaghDhdgYRFe',
        'music-media-grid': 'https://www.youtube.com/watch?v=Isdf9yz6_Xk&list=PL676CTzKxGm4Xu8H_ZLvVpB9W3ny454s7'
    };

    const playlistUrl = playlistUrls[gridId] || '#';

    const playlistCard = document.createElement('div');
    playlistCard.className = 'media-card view-playlist-card';
    playlistCard.innerHTML = `
        <div class="playlist-card-content">
            <div class="youtube-logo">
                <svg viewBox="0 0 90 90" width="90" height="90">
                    <rect width="90" height="90" rx="22" fill="#FF0000"/>
                    <polygon points="36,27 36,63 63,45" fill="white"/>
                </svg>
            </div>
            <a href="${playlistUrl}" target="_blank" class="view-playlist-button">
                <svg width="24" height="24" viewBox="0 0 24 24" class="yt-icon">
                    <rect width="24" height="24" rx="5" fill="currentColor"/>
                    <polygon points="9.5,7 9.5,17 16.5,12" fill="white"/>
                </svg>
                View Full Playlist
            </a>
        </div>
    `;
    mediaGrid.appendChild(playlistCard);
}

// Helper to get playlist ID for each grid
function getPlaylistIdForGrid(gridId) {
    switch (gridId) {
        case 'sermons-grid':
            return 'PL615tmMR_c6UIx4yXrDinZCcfiS1BOTsV';
        case 'sabbath-school-grid':
            return 'PL615tmMR_c6X0KfJvu07enaghDhdgYRFe';
        case 'music-media-grid':
            return 'PL676CTzKxGm4Xu8H_ZLvVpB9W3ny454s7';
        default:
            return '';
    }
}

function loadDevotional() {
    const devotionalCard = document.getElementById('devotionalCard');
    if (!devotionalCard) return;

    // Placeholder for devotional content - replace with API call
    devotionalCard.innerHTML = `
        <h4>A Daily Dose of Inspiration</h4>
        <p>"For where two or three gather in my name, there am I with them." - Matthew 18:20</p>
        <p>Let this verse be a reminder of God's presence when we come together in faith.</p>
        <button class="btn btn-primary" onclick="alert('Generate Devotional functionality will be implemented via backend API.')">Generate Today's Devotional (Admin Only)</button>
    `;
}

// Placeholder for prayer request form URL - replace with your API call
const prayerRequestFormUrl = 'https://forms.gle/your-prayer-request-form';

// Intersection Observer for animations
function initializeAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.worship-card, .event-card, .media-card, .devotional-card, .prayer-request-card');
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// === DONATION SECTION LOGIC ===
document.addEventListener('DOMContentLoaded', function () {
    // Tab switching for donation section
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            // Remove active from all
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));
            // Add active to selected
            btn.classList.add('active');
            const tab = btn.getAttribute('data-tab');
            document.getElementById(tab).classList.add('active');
        });
    });

    // Show/hide recurring options
    const oneTimeRadio = document.getElementById('oneTime');
    const recurringRadio = document.getElementById('recurring');
    const recurringOptions = document.querySelector('.recurring-options');
    if (oneTimeRadio && recurringRadio && recurringOptions) {
        oneTimeRadio.addEventListener('change', function () {
            if (oneTimeRadio.checked) {
                recurringOptions.style.display = 'none';
            }
        });
        recurringRadio.addEventListener('change', function () {
            if (recurringRadio.checked) {
                recurringOptions.style.display = 'block';
            }
        });
    }

    // Donation form submit handler
    const donationForm = document.querySelector('.donation-form');
    if (donationForm) {
        donationForm.addEventListener('submit', function (e) {
            e.preventDefault();
            // Collect form data
            const formData = new FormData(donationForm);
            const data = Object.fromEntries(formData.entries());
            // Simple validation
            if (!data.firstName || !data.lastName || !data.email || !data.donationType || !data.amount) {
                alert('Please fill in all required fields.');
                return;
            }
            // Simulate payment (replace with real integration)
            alert(`Thank you, ${data.firstName}! Your donation of ₱${data.amount} (${data.donationType}) has been received. [Simulated]`);
            donationForm.reset();
            // Hide recurring options if shown
            if (recurringOptions) recurringOptions.style.display = 'none';
        });
    }
});

// === LOGIN/LOGOUT BUTTON LOGIC ===
document.addEventListener('DOMContentLoaded', function () {
    // Header and mobile menu buttons
    const nav = document.querySelector('.nav');
    const loginBtn = document.getElementById('openLoginModal');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileLoginBtn = document.getElementById('openLoginModalMobile');

    // Remove existing logout button if any
    let logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.remove();
    let mobileLogoutBtn = document.getElementById('logoutBtnMobile');
    if (mobileLogoutBtn) mobileLogoutBtn.remove();

    function handleAuthButtons() {
        const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
        if (nav && loginBtn) {
            if (loggedIn) {
                loginBtn.style.display = 'none';
                // Add logout button if not present
                if (!document.getElementById('logoutBtn')) {
                    const btn = document.createElement('button');
                    btn.className = 'nav-link login-btn';
                    btn.id = 'logoutBtn';
                    btn.textContent = 'Log out';
                    btn.style.marginLeft = '8px';
                    btn.onclick = function () {
                        localStorage.removeItem('isLoggedIn');
                        window.location.reload();
                    };
                    nav.appendChild(btn);
                }
            } else {
                loginBtn.style.display = '';
                const existing = document.getElementById('logoutBtn');
                if (existing) existing.remove();
            }
        }
        if (mobileMenu && mobileLoginBtn) {
            if (loggedIn) {
                mobileLoginBtn.style.display = 'none';
                if (!document.getElementById('logoutBtnMobile')) {
                    const btn = document.createElement('button');
                    btn.className = 'mobile-nav-link login-btn';
                    btn.id = 'logoutBtnMobile';
                    btn.textContent = 'Log out';
                    btn.onclick = function () {
                        localStorage.removeItem('isLoggedIn');
                        window.location.reload();
                    };
                    mobileMenu.appendChild(btn);
                }
            } else {
                mobileLoginBtn.style.display = '';
                const existing = document.getElementById('logoutBtnMobile');
                if (existing) existing.remove();
            }
        }
    }
    handleAuthButtons();
});

// Local fallback thumbnail (inline SVG) so cards never depend on an external
// placeholder-image service being reachable.
const NO_THUMBNAIL_IMG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200">' +
    '<rect width="100%" height="100%" fill="#e5e7eb"/>' +
    '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" ' +
    'font-family="Inter,sans-serif" font-size="16" fill="#6b7280">No Thumbnail</text>' +
    '</svg>'
);

// Renders either a YouTube thumbnail link (existing behavior) or, when a sermon
// has a generic FB/IG/YouTube post link but no YouTube API thumbnail, an iframe embed.
function renderSermonMedia(item, imgClass) {
    if (!item.youtubeThumbnail && item.videoUrl && window.EmbedUtils) {
        const { embedUrl } = window.EmbedUtils.detectPlatform(item.videoUrl);
        if (embedUrl) {
            return `<iframe src="${embedUrl}" style="width:100%;height:100%;border:none;" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>`;
        }
    }

    return `
        <a href="${item.youtubeUrl || item.videoUrl || '#'}" target="_blank">
            <img src="${item.youtubeThumbnail || NO_THUMBNAIL_IMG}" alt="${item.title}" class="${imgClass}">
            <div class="thumbnail-overlay"><div class="thumbnail-play"><i class="fab fa-youtube"></i></div></div>
        </a>
    `;
}

function loadSermonsPage() {
    fetch('/api/sermons?limit=7')
        .then(res => res.json())
        .then(data => {
            const sermons = data.sermons || [];
            if (sermons.length === 0) return;

            // Find featured sermon (most views)
            let featured = sermons[0];
            sermons.forEach(s => {
                if ((s.youtubeViewCount || 0) > (featured.youtubeViewCount || 0)) featured = s;
            });
            // Remove featured from the list
            const recent = sermons.filter(s => s._id !== featured._id).slice(0, 6);

            // Render featured sermon
            const featuredContainer = document.getElementById('featured-sermon');
            if (featuredContainer) {
                featuredContainer.innerHTML = `
                    <div class="featured-video">
                        ${renderSermonMedia(featured, 'featured-img')}
                    </div>
                    <div class="featured-info">
                        <div class="sermon-date"><i class="fas fa-calendar"></i> <span>${formatDate(featured.date)}</span></div>
                        <h3>${featured.title}</h3>
                        <p>${featured.description || ''}</p>
                        <div class="sermon-tags">
                            ${(featured.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                        <div class="sermon-meta"><i class="fas fa-eye"></i> ${featured.youtubeViewCount || 0} views</div>
                        <a href="${featured.youtubeUrl || '#'}" class="btn btn-primary" target="_blank">Watch Sermon</a>
                    </div>
                `;
            }

            // Render recent sermons
            const grid = document.getElementById('sermons-grid');
            if (grid) {
                grid.innerHTML = '';
                recent.forEach(item => {
                    const card = document.createElement('div');
                    card.className = 'sermon-card';
                    card.innerHTML = `
                        <div class="sermon-thumbnail">
                            ${renderSermonMedia(item, '')}
                        </div>
                        <div class="sermon-info">
                            <div class="sermon-date"><i class="fas fa-calendar"></i> <span>${formatDate(item.date)}</span></div>
                            <h3><a href="${item.youtubeUrl || '#'}" target="_blank">${item.title}</a></h3>
                            <p>${item.description || ''}</p>
                            <div class="sermon-meta"><i class="fas fa-eye"></i> ${item.youtubeViewCount || 0} views</div>
                            <a href="${item.youtubeUrl || '#'}" class="btn btn-outline btn-sm" target="_blank">Watch Sermon</a>
                        </div>
                    `;
                    grid.appendChild(card);
                });
            }
        });
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

document.addEventListener('DOMContentLoaded', function () {
    // View Full Schedule button logic
    const viewFullScheduleBtn = document.getElementById('viewFullScheduleBtn');
    const loginModal = document.getElementById('loginModal');
    if (viewFullScheduleBtn) {
        viewFullScheduleBtn.addEventListener('click', function (e) {
            e.preventDefault();
            // Always navigate/scroll to events section
            const eventsSection = document.querySelector('section.events');
            if (eventsSection) {
                eventsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                // fallback: go to events.html if section not found
                window.location.href = 'events.html';
            }
        });
    }
    // View All Events button logic
    const viewAllEventsBtn = document.getElementById('viewAllEventsBtn');
    if (viewAllEventsBtn) {
        // Allow navigation to events list without requiring login
        viewAllEventsBtn.addEventListener('click', function (e) {
            // default navigation proceeds
        });
    }
    // Donate Now and Scan QR Code buttons logic
    const donateNowBtn = document.getElementById('donateNowBtn');
    const scanQrBtn = document.getElementById('scanQrBtn');
    // Donate Now and Scan QR Code: allow navigation without login
    [donateNowBtn, scanQrBtn].forEach(function(btn) {
        if (btn) {
            // no-op click handler so default anchor navigation works
            btn.addEventListener('click', function() {});
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const mobileMenu = document.querySelector('.mobile-menu');

    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', () => {
            if (mobileMenu) {
                mobileMenu.classList.toggle('hidden');
            }
        });
    }
});

// Fetch API status from the backend
async function getApiStatus() {
  try {
    const response = await fetch('/api');
    const data = await response.text();
    const apiStatusElement = document.getElementById('api-status');
    if (apiStatusElement) {
      apiStatusElement.textContent = data;
    }
  } catch (error) {
    console.error('Error fetching API status:', error);
    const apiStatusElement = document.getElementById('api-status');
    if (apiStatusElement) {
      apiStatusElement.textContent = 'Error connecting to API';
    }
  }
}

// Call the function on page load
document.addEventListener('DOMContentLoaded', getApiStatus);


// Fetch YouTube playlist items and render them in the Sermons subsection (sermons-grid)
async function fetchYouTubePlaylistItems() {
  // Only fetch the Sermons playlist (replace playlistId if needed)
  const API_URL = "https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=PL615tmMR_c6UIx4yXrDinZCcfiS1BOTsV&key=AIzaSyB8DeJQCLlcnhyICxknGGhQojpmqvjbKII";
  const sermonsGrid = document.getElementById('sermons-grid');
  if (!sermonsGrid) return;
  sermonsGrid.innerHTML = '<h3>Loading videos...</h3>';
  try {
    const res = await fetch(API_URL, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });
    const data = await res.json();
    sermonsGrid.innerHTML = '';
    data.items.forEach((el, idx) => {
      sermonsGrid.innerHTML += `
        <div class="yt-video" data-video-id="${el.snippet.resourceId.videoId}" data-yt-link="https://www.youtube.com/watch?v=${el.snippet.resourceId.videoId}">
          <iframe src="https://www.youtube.com/embed/${el.snippet.resourceId.videoId}?enablejsapi=1" allowfullscreen></iframe>
          <h3>${el.snippet.title}</h3>
        </div>
      `;
    });

    // Add mouseover/mouseout/click events for autoplay and navigation
    const videoDivs = sermonsGrid.querySelectorAll('.yt-video');
    let lastPlaying = null;
    videoDivs.forEach(div => {
      const iframe = div.querySelector('iframe');
      // Mouseover: play
      div.addEventListener('mouseenter', function() {
        // Pause last playing
        if (lastPlaying && lastPlaying !== iframe) {
          lastPlaying.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        }
        // Play this
        iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        lastPlaying = iframe;
      });
      // Mouseout: pause
      div.addEventListener('mouseleave', function() {
        iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        lastPlaying = null;
      });
      // Click: go to YouTube
      div.addEventListener('click', function(e) {
        // Only open link if not clicking on the iframe itself
        if (e.target.tagName !== 'IFRAME') {
          window.open(div.getAttribute('data-yt-link'), '_blank');
        }
      });
    });
  } catch (err) {
    console.log(err);
    sermonsGrid.innerHTML = '<h3>Sorry something went wrong, try again later</h3>';
  }
}

// Note: fetchYouTubePlaylistItems() (raw YouTube playlist fetch) is no longer
// called - #sermons-grid on every page is now owned by loadSermonsPage()
// (DB-backed, admin-manageable via /api/sermons) so Home and Sermons show the same list.
document.addEventListener('DOMContentLoaded', fetchSabbathSchoolPlaylistItems);
document.addEventListener('DOMContentLoaded', fetchMusicMediaPlaylistItems);