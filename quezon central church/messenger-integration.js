// Messenger API Integration for Church Chat Widget
class MessengerIntegration {
    constructor(config) {
        this.pageAccessToken = config.pageAccessToken;
        this.verifyToken = config.verifyToken;
        this.pageId = config.pageId;
        this.apiUrl = 'https://graph.facebook.com/v18.0';
        this.webhookUrl = config.webhookUrl;
        this.isConnected = false;
        
        this.init();
    }

    async init() {
        try {
            await this.verifyPageAccess();
            this.setupWebhook();
            this.isConnected = true;
            console.log('Messenger integration initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Messenger integration:', error);
        }
    }

    // Verify page access token
    async verifyPageAccess() {
        const response = await fetch(`${this.apiUrl}/me?access_token=${this.pageAccessToken}`);
        if (!response.ok) {
            throw new Error('Invalid page access token');
        }
        const data = await response.json();
        console.log('Connected to page:', data.name);
        return data;
    }

    // Send message to Messenger user
    async sendToMessenger(recipientId, message, messageType = 'text') {
        if (!this.isConnected) {
            throw new Error('Messenger not connected');
        }

        const messageData = {
            recipient: { id: recipientId },
            message: this.formatMessage(message, messageType),
            messaging_type: 'RESPONSE'
        };

        try {
            const response = await fetch(`${this.apiUrl}/me/messages?access_token=${this.pageAccessToken}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messageData)
            });

            if (!response.ok) {
                throw new Error(`Messenger API error: ${response.status}`);
            }

            const result = await response.json();
            console.log('Message sent to Messenger:', result);
            return result;
        } catch (error) {
            console.error('Error sending to Messenger:', error);
            throw error;
        }
    }

    // Format message based on type
    formatMessage(content, type) {
        switch (type) {
            case 'text':
                return { text: content };
            case 'quick_reply':
                return {
                    text: content.text,
                    quick_replies: content.quick_replies
                };
            case 'template':
                return { attachment: content };
            default:
                return { text: content };
        }
    }

    // Handle incoming webhook from Messenger
    handleWebhook(body) {
        if (body.object === 'page') {
            body.entry.forEach(entry => {
                entry.messaging?.forEach(event => {
                    if (event.message) {
                        this.handleIncomingMessage(event);
                    } else if (event.postback) {
                        this.handlePostback(event);
                    }
                });
            });
        }
    }

    // Process incoming message from Messenger
    async handleIncomingMessage(event) {
        const senderId = event.sender.id;
        const message = event.message.text;
        const timestamp = event.timestamp;

        // Get user info
        const userInfo = await this.getUserInfo(senderId);
        
        // Forward to website chat
        this.forwardToWebsite({
            senderId,
            message,
            timestamp,
            userInfo,
            platform: 'messenger'
        });

        // Send auto-response if needed
        if (this.shouldAutoRespond(message)) {
            await this.sendAutoResponse(senderId, message);
        }
    }

    // Get Messenger user information
    async getUserInfo(userId) {
        try {
            const response = await fetch(
                `${this.apiUrl}/${userId}?fields=first_name,last_name,profile_pic&access_token=${this.pageAccessToken}`
            );
            
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Error getting user info:', error);
        }
        
        return { first_name: 'Visitor', last_name: '' };
    }

    // Forward message to website chat system
    forwardToWebsite(messageData) {
        // Emit to website chat interface
        if (window.chatWidget) {
            window.chatWidget.receiveMessengerMessage(messageData);
        }

        // Send to backend for processing
        fetch(apiUrl('/api/chat/messenger-message'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(messageData)
        }).catch(error => {
            console.error('Error forwarding to website:', error);
        });
    }

    // Check if auto-response is needed
    shouldAutoRespond(message) {
        const autoResponseTriggers = [
            'hello', 'hi', 'help', 'info', 'hours', 'service', 'prayer'
        ];
        
        return autoResponseTriggers.some(trigger => 
            message.toLowerCase().includes(trigger)
        );
    }

    // Send automatic response
    async sendAutoResponse(senderId, message) {
        const lowerMessage = message.toLowerCase();
        let response = '';

        if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            response = "Hello! Welcome to Quezon Central Church. How can we help you today?";
        } else if (lowerMessage.includes('hours') || lowerMessage.includes('service')) {
            response = "Our worship services are:\n• Sabbath Morning: 9:00 AM\n• Sabbath School: 10:30 AM\n• Prayer Meeting: Wednesday 7:00 PM";
        } else if (lowerMessage.includes('prayer')) {
            response = "We'd be honored to pray for you. Please share your prayer request and our prayer team will lift you up in prayer.";
        } else if (lowerMessage.includes('help') || lowerMessage.includes('info')) {
            response = "I'm here to help! You can ask about:\n• Service times\n• Prayer requests\n• Church events\n• Contact information\n\nOr connect with our staff for personal assistance.";
        }

        if (response) {
            await this.sendToMessenger(senderId, response);
        }
    }

    // Setup webhook subscription
    async setupWebhook() {
        const subscriptionData = {
            object: 'page',
            callback_url: this.webhookUrl,
            verify_token: this.verifyToken,
            fields: 'messages,messaging_postbacks'
        };

        try {
            const response = await fetch(`${this.apiUrl}/${this.pageId}/subscribed_apps?access_token=${this.pageAccessToken}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(subscriptionData)
            });

            if (response.ok) {
                console.log('Webhook subscription successful');
            }
        } catch (error) {
            console.error('Webhook setup error:', error);
        }
    }

    // Create quick reply options
    createQuickReplies(text, options) {
        return {
            text,
            quick_replies: options.map(option => ({
                content_type: 'text',
                title: option.title,
                payload: option.payload
            }))
        };
    }

    // Create button template
    createButtonTemplate(text, buttons) {
        return {
            type: 'template',
            payload: {
                template_type: 'button',
                text,
                buttons: buttons.map(button => ({
                    type: button.type || 'postback',
                    title: button.title,
                    payload: button.payload || button.url
                }))
            }
        };
    }

    // Handle postback events
    async handlePostback(event) {
        const senderId = event.sender.id;
        const payload = event.postback.payload;

        switch (payload) {
            case 'GET_STARTED':
                await this.sendWelcomeMessage(senderId);
                break;
            case 'PRAYER_REQUEST':
                await this.handlePrayerRequest(senderId);
                break;
            case 'SERVICE_TIMES':
                await this.sendServiceTimes(senderId);
                break;
            case 'CONTACT_STAFF':
                await this.connectToStaff(senderId);
                break;
            default:
                console.log('Unknown postback:', payload);
        }
    }

    // Send welcome message with options
    async sendWelcomeMessage(senderId) {
        const welcomeText = "Welcome to Quezon Central Church! How can we assist you today?";
        const quickReplies = this.createQuickReplies(welcomeText, [
            { title: "Service Times", payload: "SERVICE_TIMES" },
            { title: "Prayer Request", payload: "PRAYER_REQUEST" },
            { title: "Contact Staff", payload: "CONTACT_STAFF" },
            { title: "Church Info", payload: "CHURCH_INFO" }
        ]);

        await this.sendToMessenger(senderId, quickReplies, 'quick_reply');
    }

    // Handle prayer request
    async handlePrayerRequest(senderId) {
        const message = "We're honored to pray for you. Please share your prayer request, and our prayer team will lift you up in prayer. Your request will be kept confidential.";
        await this.sendToMessenger(senderId, message);
        
        // Mark user as expecting prayer request
        this.setUserState(senderId, 'awaiting_prayer_request');
    }

    // Send service times
    async sendServiceTimes(senderId) {
        const serviceInfo = `🏛️ Quezon Central Church Service Times:

📅 Sabbath Services:
• Morning Worship: 9:00 AM
• Sabbath School: 10:30 AM

📅 Weekday Services:
• Prayer Meeting: Wednesday 7:00 PM

📍 Location: [Your Church Address]

We look forward to worshiping with you! 🙏`;

        await this.sendToMessenger(senderId, serviceInfo);
    }

    // Connect user to staff
    async connectToStaff(senderId) {
        const userInfo = await this.getUserInfo(senderId);
        const message = `Hello ${userInfo.first_name}! I'm connecting you with our church staff. They'll be with you shortly to provide personal assistance.`;
        
        await this.sendToMessenger(senderId, message);
        
        // Notify staff of incoming request
        this.notifyStaff({
            senderId,
            userInfo,
            timestamp: Date.now(),
            type: 'staff_request'
        });
    }

    // Notify staff of incoming requests
    notifyStaff(requestData) {
        // Send to website admin interface
        if (window.adminInterface) {
            window.adminInterface.newMessengerRequest(requestData);
        }

        // Send to backend for staff notification
        fetch(apiUrl('/api/admin/messenger-request'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        }).catch(error => {
            console.error('Error notifying staff:', error);
        });
    }

    // Set user conversation state
    setUserState(userId, state) {
        // Store in localStorage or send to backend
        localStorage.setItem(`messenger_user_${userId}`, JSON.stringify({
            state,
            timestamp: Date.now()
        }));
    }

    // Get user conversation state
    getUserState(userId) {
        const stored = localStorage.getItem(`messenger_user_${userId}`);
        return stored ? JSON.parse(stored) : null;
    }

    // Disconnect from Messenger
    disconnect() {
        this.isConnected = false;
        console.log('Messenger integration disconnected');
    }
}

// Website Chat Widget Extension for Messenger
class ChatWidgetMessengerExtension {
    constructor(chatWidget, messengerIntegration) {
        this.chatWidget = chatWidget;
        this.messenger = messengerIntegration;
        this.activeMessengerChats = new Map();
        
        this.init();
    }

    init() {
        this.addMessengerButton();
        this.setupMessageHandlers();
    }

    // Add Messenger connection button to chat widget
    addMessengerButton() {
        const chatHeader = document.querySelector('.chat-header');
        if (chatHeader) {
            const messengerBtn = document.createElement('button');
            messengerBtn.className = 'messenger-toggle';
            messengerBtn.innerHTML = '<i class="fab fa-facebook-messenger"></i>';
            messengerBtn.title = 'Connect to Messenger';
            messengerBtn.onclick = () => this.toggleMessengerMode();
            
            chatHeader.appendChild(messengerBtn);
        }
    }

    // Toggle Messenger mode
    toggleMessengerMode() {
        const chatWindow = document.getElementById('chatWindow');
        const isMessengerMode = chatWindow.classList.contains('messenger-mode');
        
        if (isMessengerMode) {
            chatWindow.classList.remove('messenger-mode');
            this.showWebsiteChat();
        } else {
            chatWindow.classList.add('messenger-mode');
            this.showMessengerChats();
        }
    }

    // Show website chat interface
    showWebsiteChat() {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = `
            <div class="message church-message">
                <div class="message-content">
                    <p>Hello! How can we help you today? Feel free to ask questions or submit a prayer request.</p>
                    <span class="message-time">${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                </div>
            </div>
        `;
    }

    // Show Messenger chats interface
    showMessengerChats() {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = `
            <div class="messenger-interface">
                <div class="messenger-header">
                    <h4>Messenger Conversations</h4>
                    <button onclick="this.parentElement.parentElement.parentElement.querySelector('.chat-form').style.display='block'">New Message</button>
                </div>
                <div class="messenger-chats" id="messengerChats">
                    ${this.renderMessengerChats()}
                </div>
            </div>
        `;
    }

    // Render active Messenger conversations
    renderMessengerChats() {
        if (this.activeMessengerChats.size === 0) {
            return '<p class="no-chats">No active Messenger conversations</p>';
        }

        let html = '';
        this.activeMessengerChats.forEach((chat, senderId) => {
            html += `
                <div class="messenger-chat" data-sender-id="${senderId}">
                    <div class="chat-avatar">
                        <img src="${chat.userInfo.profile_pic || '/assets/default-avatar.png'}" alt="User">
                    </div>
                    <div class="chat-info">
                        <h5>${chat.userInfo.first_name} ${chat.userInfo.last_name}</h5>
                        <p class="last-message">${chat.lastMessage}</p>
                        <span class="message-time">${new Date(chat.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <button onclick="chatWidget.openMessengerChat('${senderId}')">Reply</button>
                </div>
            `;
        });

        return html;
    }

    // Receive message from Messenger
    receiveMessengerMessage(messageData) {
        const { senderId, message, userInfo, timestamp } = messageData;
        
        // Update active chats
        this.activeMessengerChats.set(senderId, {
            userInfo,
            lastMessage: message,
            timestamp,
            messages: this.activeMessengerChats.get(senderId)?.messages || []
        });

        // Add message to conversation
        const chat = this.activeMessengerChats.get(senderId);
        chat.messages.push({
            text: message,
            timestamp,
            sender: 'user'
        });

        // Update UI if in Messenger mode
        const chatWindow = document.getElementById('chatWindow');
        if (chatWindow.classList.contains('messenger-mode')) {
            this.showMessengerChats();
        }

        // Show notification
        this.showNotification(`New message from ${userInfo.first_name}`, message);
    }

    // Open specific Messenger chat
    openMessengerChat(senderId) {
        const chat = this.activeMessengerChats.get(senderId);
        if (!chat) return;

        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = `
            <div class="messenger-conversation">
                <div class="conversation-header">
                    <button onclick="chatWidget.messengerExtension.showMessengerChats()">← Back</button>
                    <div class="user-info">
                        <img src="${chat.userInfo.profile_pic || '/assets/default-avatar.png'}" alt="User">
                        <span>${chat.userInfo.first_name} ${chat.userInfo.last_name}</span>
                    </div>
                </div>
                <div class="conversation-messages">
                    ${this.renderConversationMessages(chat.messages)}
                </div>
            </div>
        `;

        // Update form to send to this user
        const chatForm = document.getElementById('chatForm');
        chatForm.dataset.senderId = senderId;
    }

    // Render conversation messages
    renderConversationMessages(messages) {
        return messages.map(msg => `
            <div class="message ${msg.sender === 'user' ? 'user-message' : 'church-message'}">
                <div class="message-content">
                    <p>${msg.text}</p>
                    <span class="message-time">${new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
            </div>
        `).join('');
    }

    // Send message to Messenger user
    async sendToMessengerUser(senderId, message) {
        try {
            await this.messenger.sendToMessenger(senderId, message);
            
            // Update local chat
            const chat = this.activeMessengerChats.get(senderId);
            if (chat) {
                chat.messages.push({
                    text: message,
                    timestamp: Date.now(),
                    sender: 'church'
                });
                chat.lastMessage = `You: ${message}`;
            }

            return true;
        } catch (error) {
            console.error('Error sending to Messenger:', error);
            return false;
        }
    }

    // Show notification
    showNotification(title, message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '/logo/qonnect.png'
            });
        }
    }

    // Setup message handlers
    setupMessageHandlers() {
        const chatForm = document.getElementById('chatForm');
        if (chatForm) {
            chatForm.addEventListener('submit', async (e) => {
                const senderId = chatForm.dataset.senderId;
                if (senderId) {
                    e.preventDefault();
                    const input = document.getElementById('chatInput');
                    const message = input.value.trim();
                    
                    if (message) {
                        const success = await this.sendToMessengerUser(senderId, message);
                        if (success) {
                            input.value = '';
                            // Refresh conversation view
                            this.openMessengerChat(senderId);
                        }
                    }
                }
            });
        }
    }
}

// Initialize Messenger integration when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
});

// Export for use in other files
window.MessengerIntegration = MessengerIntegration;
window.ChatWidgetMessengerExtension = ChatWidgetMessengerExtension;