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

if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const message = chatInput.value.trim();
        if (!message) return;
        
        // Add user message
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        
        const userMessage = document.createElement('div');
        userMessage.className = 'message user-message';
        userMessage.innerHTML = `
            <div class="message-content">
                <p>${message}</p>
                <span class="message-time">${timeString}</span>
            </div>
        `;
        
        chatMessages.appendChild(userMessage);
        chatInput.value = '';
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Simulate response
        setTimeout(() => {
            const responseTime = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            const churchMessage = document.createElement('div');
            churchMessage.className = 'message church-message';
            churchMessage.innerHTML = `
                <div class="message-content">
                    <p>Thank you for your message. One of our team members will respond to you soon. If this is a prayer request, rest assured it will be shared with our prayer team.</p>
                    <span class="message-time">${responseTime}</span>
                </div>
            `;
            
            chatMessages.appendChild(churchMessage);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 1000);
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

document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
    loadMedia();
    loadDevotional();
    initializeAnimations();
});

function openForm(url) {
    window.open(url, '_blank');
}

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

function loadMedia() {
    populateMediaGrid('sermons-grid', sermonsData);
    populateMediaGrid('sabbath-school-grid', sabbathSchoolData);
    populateMediaGrid('music-media-grid', musicMediaData);
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