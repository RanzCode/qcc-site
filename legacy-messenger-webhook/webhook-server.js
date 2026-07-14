// Messenger Webhook Server (Node.js/Express)
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Messenger configuration
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const FACEBOOK_VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN || 'church_webhook_verify_token_2025';
const FACEBOOK_PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

// Store active conversations (in production, use a database)
const activeConversations = new Map();
const staffNotifications = [];

// Verify webhook signature
function verifySignature(req, res, next) {
    const signature = req.headers['x-hub-signature-256'];
    
    if (!signature) {
        console.error('No signature found');
        return res.status(401).send('Unauthorized');
    }

    const expectedSignature = crypto
        .createHmac('sha256', FACEBOOK_APP_SECRET)
        .update(req.body, 'utf8')
        .digest('hex');

    if (signature !== `sha256=${expectedSignature}`) {
        console.error('Invalid signature');
        return res.status(401).send('Unauthorized');
    }

    next();
}

// Webhook verification (GET)
app.get('/webhook/messenger', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === FACEBOOK_VERIFY_TOKEN) {
        console.log('Webhook verified successfully');
        res.status(200).send(challenge);
    } else {
        console.error('Webhook verification failed');
        res.status(403).send('Forbidden');
    }
});

// Webhook endpoint (POST)
app.post('/webhook/messenger', verifySignature, (req, res) => {
    const body = req.body;

    if (body.object === 'page') {
        body.entry.forEach(entry => {
            entry.messaging?.forEach(event => {
                if (event.message) {
                    handleMessage(event);
                } else if (event.postback) {
                    handlePostback(event);
                } else if (event.delivery) {
                    handleDelivery(event);
                } else if (event.read) {
                    handleRead(event);
                }
            });
        });

        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.status(404).send('Not Found');
    }
});

// Handle incoming messages
async function handleMessage(event) {
    const senderId = event.sender.id;
    const message = event.message;
    const timestamp = event.timestamp;

    console.log(`Received message from ${senderId}: ${message.text}`);

    // Store conversation
    if (!activeConversations.has(senderId)) {
        const userInfo = await getUserInfo(senderId);
        activeConversations.set(senderId, {
            userInfo,
            messages: [],
            lastActivity: timestamp,
            status: 'active'
        });
    }

    const conversation = activeConversations.get(senderId);
    conversation.messages.push({
        text: message.text,
        timestamp,
        sender: 'user',
        messageId: message.mid
    });
    conversation.lastActivity = timestamp;

    // Check for special keywords
    if (message.text) {
        const lowerText = message.text.toLowerCase();
        
        if (lowerText.includes('prayer') || lowerText.includes('pray')) {
            await handlePrayerRequest(senderId, message.text);
        } else if (lowerText.includes('staff') || lowerText.includes('pastor') || lowerText.includes('help')) {
            await connectToStaff(senderId);
        } else if (lowerText.includes('service') || lowerText.includes('time') || lowerText.includes('schedule')) {
            await sendServiceTimes(senderId);
        } else if (isGreeting(lowerText)) {
            await sendWelcomeMessage(senderId);
        }
    }

    // Notify website of new message
    notifyWebsite({
        type: 'new_message',
        senderId,
        message: message.text,
        timestamp,
        userInfo: conversation.userInfo
    });
}

// Handle postback events
async function handlePostback(event) {
    const senderId = event.sender.id;
    const payload = event.postback.payload;
    const title = event.postback.title;

    console.log(`Received postback from ${senderId}: ${payload}`);

    switch (payload) {
        case 'GET_STARTED':
            await sendWelcomeMessage(senderId);
            break;
        case 'PRAYER_REQUEST':
            await handlePrayerRequest(senderId);
            break;
        case 'SERVICE_TIMES':
            await sendServiceTimes(senderId);
            break;
        case 'CONTACT_STAFF':
            await connectToStaff(senderId);
            break;
        case 'CHURCH_INFO':
            await sendChurchInfo(senderId);
            break;
        default:
            console.log(`Unknown postback: ${payload}`);
    }
}

// Handle delivery confirmations
function handleDelivery(event) {
    const senderId = event.sender.id;
    const conversation = activeConversations.get(senderId);
    
    if (conversation) {
        conversation.lastDelivery = event.delivery.watermark;
    }
}

// Handle read receipts
function handleRead(event) {
    const senderId = event.sender.id;
    const conversation = activeConversations.get(senderId);
    
    if (conversation) {
        conversation.lastRead = event.read.watermark;
    }
}

// Get user information from Facebook
async function getUserInfo(userId) {
    try {
        const response = await fetch(
            `https://graph.facebook.com/v18.0/${userId}?fields=first_name,last_name,profile_pic&access_token=${FACEBOOK_PAGE_ACCESS_TOKEN}`
        );
        
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error('Error getting user info:', error);
    }
    
    return { first_name: 'Visitor', last_name: '', profile_pic: null };
}

// Send message to user
async function sendMessage(recipientId, messageData) {
    const requestBody = {
        recipient: { id: recipientId },
        message: messageData,
        messaging_type: 'RESPONSE'
    };

    try {
        const response = await fetch('https://graph.facebook.com/v18.0/me/messages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${FACEBOOK_PAGE_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        // Store sent message
        const conversation = activeConversations.get(recipientId);
        if (conversation) {
            conversation.messages.push({
                text: messageData.text || 'Template message',
                timestamp: Date.now(),
                sender: 'church',
                messageId: result.message_id
            });
        }

        return result;
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
}

// Send welcome message
async function sendWelcomeMessage(senderId) {
    const messageData = {
        text: "Welcome to Quezon Central Church! 🏛️\n\nHow can we help you today?",
        quick_replies: [
            {
                content_type: "text",
                title: "Service Times",
                payload: "SERVICE_TIMES"
            },
            {
                content_type: "text",
                title: "Prayer Request",
                payload: "PRAYER_REQUEST"
            },
            {
                content_type: "text",
                title: "Contact Staff",
                payload: "CONTACT_STAFF"
            },
            {
                content_type: "text",
                title: "Church Info",
                payload: "CHURCH_INFO"
            }
        ]
    };

    await sendMessage(senderId, messageData);
}

// Handle prayer requests
async function handlePrayerRequest(senderId, requestText = null) {
    if (requestText) {
        // User has submitted a prayer request
        const messageData = {
            text: "Thank you for sharing your prayer request with us. 🙏\n\nOur prayer team will lift you up in prayer. Your request will be kept confidential.\n\nIs there anything else we can help you with?"
        };

        await sendMessage(senderId, messageData);

        // Notify staff of prayer request
        const conversation = activeConversations.get(senderId);
        staffNotifications.push({
            type: 'prayer_request',
            senderId,
            userInfo: conversation?.userInfo,
            request: requestText,
            timestamp: Date.now()
        });

        notifyWebsite({
            type: 'prayer_request',
            senderId,
            request: requestText,
            userInfo: conversation?.userInfo
        });
    } else {
        // Prompt for prayer request
        const messageData = {
            text: "We're honored to pray for you. 🙏\n\nPlease share your prayer request, and our prayer team will lift you up in prayer. Your request will be kept confidential."
        };

        await sendMessage(senderId, messageData);
    }
}

// Send service times
async function sendServiceTimes(senderId) {
    const messageData = {
        text: `🏛️ Quezon Central Church Service Times:

📅 Sabbath Services:
• Morning Worship: 9:00 AM
• Sabbath School: 10:30 AM

📅 Weekday Services:
• Prayer Meeting: Wednesday 7:00 PM

📍 Location: [Your Church Address]

We look forward to worshiping with you! 🙏`
    };

    await sendMessage(senderId, messageData);
}

// Connect user to staff
async function connectToStaff(senderId) {
    const conversation = activeConversations.get(senderId);
    const userInfo = conversation?.userInfo || { first_name: 'Visitor' };

    const messageData = {
        text: `Hello ${userInfo.first_name}! 👋\n\nI'm connecting you with our church staff. They'll be with you shortly to provide personal assistance.\n\nIn the meantime, feel free to share any questions or concerns you have.`
    };

    await sendMessage(senderId, messageData);

    // Add to staff notifications
    staffNotifications.push({
        type: 'staff_request',
        senderId,
        userInfo,
        timestamp: Date.now(),
        status: 'pending'
    });

    // Notify website
    notifyWebsite({
        type: 'staff_request',
        senderId,
        userInfo,
        timestamp: Date.now()
    });
}

// Send church information
async function sendChurchInfo(senderId) {
    const messageData = {
        attachment: {
            type: "template",
            payload: {
                template_type: "generic",
                elements: [{
                    title: "Quezon Central Church",
                    subtitle: "Serving the community through faith, love, and compassion since 2016.",
                    image_url: "https://your-website.com/assets/church-image.jpg",
                    buttons: [
                        {
                            type: "web_url",
                            url: "https://your-website.com",
                            title: "Visit Website"
                        },
                        {
                            type: "postback",
                            title: "Service Times",
                            payload: "SERVICE_TIMES"
                        },
                        {
                            type: "postback",
                            title: "Contact Us",
                            payload: "CONTACT_STAFF"
                        }
                    ]
                }]
            }
        }
    };

    await sendMessage(senderId, messageData);
}

// Check if message is a greeting
function isGreeting(text) {
    const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'];
    return greetings.some(greeting => text.includes(greeting));
}

// Notify website of events
function notifyWebsite(data) {
    // In a real implementation, you might use WebSockets or Server-Sent Events
    console.log('Website notification:', data);
    
    // Store for website to poll
    // You could also use a message queue like Redis
}

// API endpoints for website integration

// Get active conversations
app.get('/api/messenger/conversations', (req, res) => {
    const conversations = Array.from(activeConversations.entries()).map(([senderId, data]) => ({
        senderId,
        ...data
    }));
    
    res.json({ conversations });
});

// Get specific conversation
app.get('/api/messenger/conversation/:senderId', (req, res) => {
    const senderId = req.params.senderId;
    const conversation = activeConversations.get(senderId);
    
    if (conversation) {
        res.json({ senderId, ...conversation });
    } else {
        res.status(404).json({ error: 'Conversation not found' });
    }
});

// Send message from website to Messenger user
app.post('/api/messenger/send', async (req, res) => {
    const { senderId, message } = req.body;
    
    if (!senderId || !message) {
        return res.status(400).json({ error: 'senderId and message are required' });
    }

    try {
        const result = await sendMessage(senderId, { text: message });
        res.json({ success: true, messageId: result.message_id });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Get staff notifications
app.get('/api/messenger/notifications', (req, res) => {
    res.json({ notifications: staffNotifications });
});

// Mark notification as handled
app.post('/api/messenger/notifications/:id/handled', (req, res) => {
    const id = parseInt(req.params.id);
    const notification = staffNotifications[id];
    
    if (notification) {
        notification.status = 'handled';
        notification.handledAt = Date.now();
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Notification not found' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        activeConversations: activeConversations.size,
        pendingNotifications: staffNotifications.filter(n => n.status !== 'handled').length
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Messenger webhook server running on port ${PORT}`);
    console.log(`Webhook URL: http://localhost:${PORT}/webhook/messenger`);
});

module.exports = app;