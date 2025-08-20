// Configuration file for API keys and sensitive data
// In production, these should be loaded from environment variables or a secure backend
const CONFIG = {
    // These are example values - replace with your actual credentials
    // For production, move these to environment variables or backend API calls
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id-here',
    FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID || 'your-facebook-app-id-here'
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}