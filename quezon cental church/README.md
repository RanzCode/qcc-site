# Security Setup Instructions

## Important Security Changes Made

The hardcoded API credentials have been removed from the HTML file and replaced with a secure backend API approach.

## Setup Steps

1. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Add your actual credentials to .env:**
   ```
   GOOGLE_CLIENT_ID=your-actual-google-client-id
   FACEBOOK_APP_ID=your-actual-facebook-app-id
   ```

3. **Never commit .env to version control** - it's already in .gitignore

## What Changed

- ✅ Removed hardcoded credentials from HTML
- ✅ Created secure backend API endpoint (`/api/config.php`)
- ✅ Added environment variables support
- ✅ Added .gitignore to prevent credential leaks
- ✅ Updated login code to fetch credentials securely

## Next Steps

1. Replace placeholder values in .env with your real credentials
2. Set up a web server to serve the PHP backend
3. Test the login functionality
4. Consider adding rate limiting and authentication to the API endpoint