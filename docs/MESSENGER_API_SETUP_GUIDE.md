# Facebook Messenger API Setup Guide

This guide will walk you through the process of setting up the Facebook Messenger API for your application.

## Prerequisites
- A Facebook Business Page
- A Facebook Developer Account
- Your application server running and accessible via HTTPS

## Step 1: Configure Webhooks

1. Go to your Facebook App's Dashboard
2. Navigate to the Messenger Platform settings
3. In the "Webhooks" section, you'll need to fill in:

   a) **Callback URL**:
   - Enter your server's webhook endpoint URL (must be HTTPS)
   - Example: `https://your-domain.com/webhook`
   - This is where Facebook will send message events

   b) **Verify Token**:
   - Create a custom verification token (make it unique and secure)
   - Save this token as you'll need it in your server configuration
   - This token helps verify that requests are coming from Facebook

   c) **Client Certificate**:
   - Optional: You can enable this for additional security
   - If enabled, attach an SSL certificate to your webhook requests

## Step 2: Generate Access Tokens

1. Click the "Connect" button to link your Facebook page
2. Select the page you want to connect to your app
3. Grant necessary permissions
4. Save the generated Page Access Token securely
   - This token is required for sending messages through the API

## Step 3: Complete App Review

1. Create a prototype of your Messenger experience
2. Request the `pages_messaging` permission
3. Submit your app for review
4. Include detailed information about:
   - How you'll use the Messenger platform
   - Your user experience
   - Test user credentials

## Step 4: Additional Settings (Optional)

### Built-in NLP
1. Navigate to the Built-in NLP section
2. Enable if you want automatic message analysis
3. This helps detect:
   - Dates
   - Times
   - Common phrases
   - Intentions

### Privacy Rules
1. Check if your page is affected by European privacy rules
2. Enter your Page IDs if requested
3. Follow any additional compliance requirements

## Security Best Practices

1. Keep your access tokens secure
2. Store tokens in environment variables
3. Implement token validation
4. Use HTTPS for all connections
5. Regularly rotate security credentials

## Testing

1. Use the Facebook Messenger Platform test tool
2. Test with development accounts first
3. Verify webhook receives events
4. Test message sending and receiving
5. Validate error handling

## Local Development Setup

For development with localhost, you'll need:

1. **Install ngrok** (provides HTTPS tunnel to localhost)
   - Download from: https://ngrok.com/download
   - Extract the zip file
   - Open terminal and navigate to ngrok's folder

2. **Start your local server first** (example using Node.js Express):
```javascript
const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

// Webhook verification
app.get('/webhook', (req, res) => {
    const VERIFY_TOKEN = "your_custom_verify_token";
    
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (mode && token === VERIFY_TOKEN) {
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// Webhook endpoint to receive events
app.post('/webhook', (req, res) => {
    console.log('Webhook event received:', req.body);
    res.status(200).send('OK');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
```

3. **Start ngrok** to create HTTPS tunnel:
```bash
# Windows Command Prompt
ngrok http 3000
```

4. **Configure Facebook Webhook:**
   - Copy the HTTPS URL from ngrok (looks like `https://abc123.ngrok.io`)
   - Add `/webhook` to the URL
   - Paste this as your Callback URL in Facebook's webhook setup
   - Example: `https://abc123.ngrok.io/webhook`
   - Create a verify token (any string) and use it in both Facebook settings and your code
   - Click "Verify and Save"

### Important Notes:
- ngrok URL changes each time you restart ngrok (unless you have a paid account)
- You'll need to update the Facebook webhook URL whenever the ngrok URL changes
- Keep the ngrok terminal window open while testing
- Your local server must be running before starting ngrok

### Testing the Setup:
1. Start your local server
2. Start ngrok
3. Configure webhook in Facebook
4. Send a test message to your Facebook page
5. Check your local server console for incoming webhook events

## Testing Webhooks with Postman

### 1. Simulating Webhook Verification
Create a GET request in Postman:
- Method: `GET`
- URL: `http://localhost:3000/webhook`
- Query Params:
  ```
  hub.mode: subscribe
  hub.verify_token: your_custom_verify_token
  hub.challenge: any_random_string
  ```

### 2. Simulating Message Events
Create a POST request in Postman:
- Method: `POST`
- URL: `http://localhost:3000/webhook`
- Headers:
  ```
  Content-Type: application/json
  ```
- Body (raw JSON):
  ```json
  {
    "object": "page",
    "entry": [{
      "id": "PAGE_ID",
      "time": 1698164078123,
      "messaging": [{
        "sender": {
          "id": "USER_ID"
        },
        "recipient": {
          "id": "PAGE_ID"
        },
        "timestamp": 1698164078123,
        "message": {
          "mid": "test_message_id",
          "text": "Hello, this is a test message!"
        }
      }]
    }]
  }
  ```

### 3. Testing Steps
1. Start your local server
2. Open Postman
3. Create the GET request to test verification
   - Expected response: The challenge value you sent
4. Create the POST request to test message handling
   - Expected response: HTTP 200 OK
5. Check your server console for logged events

### Common Response Codes
- 200: Success
- 403: Invalid verify token
- 404: Webhook endpoint not found
- 500: Server error

Note: Remember to replace `PAGE_ID` and `USER_ID` with actual values from your Facebook page when testing.

## Next Steps

1. Implement webhook handling in your server
2. Set up message handling logic
3. Configure error logging
4. Test end-to-end communication
5. Monitor message delivery and performance

Remember to review Facebook's [Messenger Platform Policy](https://developers.facebook.com/docs/messenger-platform/policy/policy-overview/) to ensure compliance with their guidelines.
