// Messenger Configuration
const MESSENGER_CONFIG = {
    // Facebook Page Access Token (get from Facebook Developer Console)
    pageAccessToken: process.env.FACEBOOK_PAGE_ACCESS_TOKEN || 'YOUR_PAGE_ACCESS_TOKEN',
    
    // Webhook Verify Token (set this in Facebook webhook settings)
    verifyToken: process.env.FACEBOOK_VERIFY_TOKEN || 'church_webhook_verify_token_2025',
    
    // Facebook Page ID
    pageId: process.env.FACEBOOK_PAGE_ID || 'YOUR_PAGE_ID',
    
    // Webhook URL (your server endpoint)
    webhookUrl: process.env.WEBHOOK_URL || 'https://your-domain.com/webhook/messenger',
    
    // Church-specific settings
    church: {
        name: 'Quezon Central Church',
        address: 'Your Church Address',
        phone: 'Your Phone Number',
        email: 'contact@quezoncentral.church',
        website: 'https://your-website.com',
        
        // Service times
        services: {
            sabbathMorning: '9:00 AM',
            sabbathSchool: '10:30 AM',
            prayerMeeting: 'Wednesday 7:00 PM'
        },
        
        // Auto-response settings
        autoResponse: {
            enabled: true,
            businessHours: {
                start: 8, // 8 AM
                end: 18,  // 6 PM
                timezone: 'Asia/Manila'
            },
            afterHoursMessage: "Thank you for contacting Quezon Central Church. Our staff will respond during business hours (8 AM - 6 PM). For urgent matters, please call our church office."
        }
    }
};

// Initialize Messenger Integration
let messengerIntegration;
let chatWidgetExtension;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize Messenger integration
        messengerIntegration = new MessengerIntegration(MESSENGER_CONFIG);
        
        // Wait for chat widget to be ready
        if (window.chatWidget || document.getElementById('chatWidget')) {
            initializeChatExtension();
        } else {
            // Wait for chat widget to load
            const observer = new MutationObserver((mutations) => {
                if (document.getElementById('chatWidget')) {
                    initializeChatExtension();
                    observer.disconnect();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }
        
    } catch (error) {
        console.error('Failed to initialize Messenger integration:', error);
    }
});

function initializeChatExtension() {
    // Initialize chat widget extension
    chatWidgetExtension = new ChatWidgetMessengerExtension(
        window.chatWidget || document.getElementById('chatWidget'),
        messengerIntegration
    );
    
    // Make available globally
    window.chatWidget.messengerExtension = chatWidgetExtension;
    window.messengerIntegration = messengerIntegration;
    
    console.log('Messenger chat extension initialized');
}

// Export configuration
window.MESSENGER_CONFIG = MESSENGER_CONFIG;