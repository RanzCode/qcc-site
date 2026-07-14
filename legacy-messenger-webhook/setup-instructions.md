# Messenger API Integration Setup Instructions

## Overview
This integration allows your Church chat widget to communicate bidirectionally with Facebook Messenger, enabling visitors to seamlessly switch between your website chat and Messenger conversations.

## Prerequisites
1. Facebook Page for your church
2. Facebook Developer Account
3. Node.js installed on your server
4. SSL certificate (HTTPS required for webhooks)

## Step 1: Facebook App Setup

### 1.1 Create Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "Create App" → "Business" → "Continue"
3. Enter app name: "Quezon Central Church Chat"
4. Add your email and select app purpose

### 1.2 Add Messenger Product
1. In your app dashboard, click "Add Product"
2. Find "Messenger" and click "Set Up"
3. In Messenger settings, scroll to "Access Tokens"
4. Select your church's Facebook Page
5. Copy the Page Access Token (save this securely)

### 1.3 Set Up Webhooks
1. In Messenger settings, find "Webhooks"
2. Click "Add Callback URL"
3. Enter your webhook URL: `https://your-domain.com/webhook/messenger`
4. Enter Verify Token: `church_webhook_verify_token_2025`
5. Subscribe to these webhook fields:
   - `messages`
   - `messaging_postbacks`
   - `message_deliveries`
   - `message_reads`

## Step 2: Server Setup

### 2.1 Install Dependencies
```bash
cd "quezon cental church"
npm install
```

### 2.2 Environment Configuration
1. Copy `.env.example` to `.env`
2. Fill in your Facebook credentials:
```env
FACEBOOK_PAGE_ACCESS_TOKEN=your_page_access_token_here
FACEBOOK_APP_SECRET=your_app_secret_here
FACEBOOK_VERIFY_TOKEN=church_webhook_verify_token_2025
FACEBOOK_PAGE_ID=your_facebook_page_id_here
WEBHOOK_URL=https://your-domain.com/webhook/messenger
```

### 2.3 Start the Server
```bash
# Development
npm run dev

# Production
npm start
```

## Step 3: Website Integration

### 3.1 Update Messenger Configuration
Edit `messenger-config.js` and update:
- `pageAccessToken`: Your Facebook Page Access Token
- `pageId`: Your Facebook Page ID
- `webhookUrl`: Your webhook endpoint URL

### 3.2 Update Messenger Link
In `index.html`, update the Messenger link:
```html
<a href="https://m.me/YOUR_PAGE_USERNAME" target="_blank" class="btn btn-primary messenger-btn">
```
Replace `YOUR_PAGE_USERNAME` with your Facebook Page username.

## Step 4: Facebook Page Configuration

### 4.1 Enable Messenger
1. Go to your Facebook Page
2. Settings → Messaging
3. Enable "Show a Messenger greeting"
4. Set up automated responses if desired

### 4.2 Set Up Get Started Button
1. In your app's Messenger settings
2. Go to "Built-in NLP" → "Get Started"
3. Add payload: `GET_STARTED`

### 4.3 Configure Persistent Menu (Optional)
Add this to your webhook server or use Facebook's API:
```javascript
const persistentMenu = {
  persistent_menu: [{
    locale: "default",
    composer_input_disabled: false,
    call_to_actions: [
      {
        type: "postback",
        title: "Service Times",
        payload: "SERVICE_TIMES"
      },
      {
        type: "postback",
        title: "Prayer Request",
        payload: "PRAYER_REQUEST"
      },
      {
        type: "postback",
        title: "Contact Staff",
        payload: "CONTACT_STAFF"
      },
      {
        type: "web_url",
        title: "Visit Website",
        url: "https://your-website.com"
      }
    ]
  }]
};
```

## Step 5: Testing

### 5.1 Test Webhook
1. Use Facebook's webhook tester
2. Send a test message to your page
3. Check server logs for incoming webhooks

### 5.2 Test Website Integration
1. Open your website
2. Click the chat widget
3. Try the "Message on Messenger" option
4. Verify the modal opens with correct Messenger link

### 5.3 Test Bidirectional Communication
1. Send a message from Messenger to your page
2. Check if it appears in your website's admin interface
3. Reply from the website
4. Verify the reply appears in Messenger

## Step 6: Production Deployment

### 6.1 Server Deployment
Deploy your webhook server to a cloud platform:
- **Heroku**: Easy deployment with git
- **AWS EC2**: Full control over server
- **DigitalOcean**: Simple VPS hosting
- **Vercel/Netlify**: For serverless functions

### 6.2 SSL Certificate
Ensure your webhook URL uses HTTPS:
- Use Let's Encrypt for free SSL
- Cloud platforms often provide SSL automatically

### 6.3 Environment Variables
Set production environment variables:
- Never commit `.env` file to version control
- Use your hosting platform's environment variable settings

## Features Included

### 6.1 Automatic Responses
The system automatically responds to common keywords:
- Greetings: "hello", "hi"
- Service times: "service", "time", "schedule"
- Prayer requests: "prayer", "pray"
- Staff contact: "staff", "pastor", "help"

### 6.2 Quick Replies
Users receive quick reply buttons for:
- Service Times
- Prayer Request
- Contact Staff
- Church Info

### 6.3 Staff Notifications
Staff receive notifications for:
- New conversations
- Prayer requests
- Staff contact requests

### 6.4 Conversation Management
- View all active Messenger conversations
- Reply to users from website interface
- Track message delivery and read status

## Customization Options

### 7.1 Auto-Response Messages
Edit messages in `webhook-server.js`:
```javascript
// Welcome message
const welcomeText = "Welcome to Quezon Central Church! 🏛️\n\nHow can we help you today?";

// Service times
const serviceInfo = `🏛️ Quezon Central Church Service Times:...`;
```

### 7.2 Quick Reply Options
Modify quick replies in the `sendWelcomeMessage` function:
```javascript
quick_replies: [
  {
    content_type: "text",
    title: "Service Times",
    payload: "SERVICE_TIMES"
  },
  // Add more options...
]
```

### 7.3 Business Hours
Configure auto-response timing in `messenger-config.js`:
```javascript
autoResponse: {
  enabled: true,
  businessHours: {
    start: 8, // 8 AM
    end: 18,  // 6 PM
    timezone: 'Asia/Manila'
  }
}
```

## Troubleshooting

### Common Issues

1. **Webhook not receiving messages**
   - Check webhook URL is accessible
   - Verify SSL certificate is valid
   - Confirm verify token matches

2. **Messages not sending**
   - Check Page Access Token is valid
   - Verify page permissions
   - Check API rate limits

3. **Website integration not working**
   - Ensure scripts are loaded in correct order
   - Check browser console for errors
   - Verify CORS settings

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
LOG_LEVEL=debug
```

## Security Considerations

1. **Webhook Verification**
   - Always verify webhook signatures
   - Use strong verify tokens
   - Validate all incoming data

2. **Access Tokens**
   - Store tokens securely
   - Use environment variables
   - Rotate tokens regularly

3. **User Data**
   - Follow GDPR/privacy regulations
   - Don't store sensitive information
   - Implement data retention policies

## Support

For technical support:
1. Check Facebook Developer documentation
2. Review server logs for errors
3. Test with Facebook's debugging tools
4. Contact your development team

## Next Steps

Consider adding:
1. Database storage for conversations
2. Admin dashboard for staff
3. Analytics and reporting
4. Multi-language support
5. Integration with church management system

---

**Note**: Replace all placeholder values (YOUR_PAGE_USERNAME, your-domain.com, etc.) with your actual values before deployment.