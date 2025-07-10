# Quezon Central Church Backend API

A comprehensive backend API for the Quezon Central Church website, featuring email integration, payment processing, YouTube API integration, and secure admin authentication.

## 🚀 Features

### ✅ Completed Backend Tasks

- **Email Integration**: Contact forms route to email service (SMTP/SendGrid)
- **Database Setup**: MongoDB collections for events, sermons, donations, contacts, and users
- **Payment Processing**: Stripe integration for secure donations
- **YouTube API**: Auto-fetch sermon videos from church YouTube channel
- **Admin Authentication**: Secure JWT-based login system with role-based permissions
- **Contact Management**: Full CRUD operations for contact form submissions
- **Event Management**: Complete event lifecycle with registration capabilities
- **Sermon Management**: YouTube integration with sermon metadata
- **Donation Tracking**: Comprehensive donation processing and reporting
- **Admin Dashboard**: Statistics, health monitoring, and system management

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Gmail account for SMTP email
- Stripe account for payment processing
- YouTube API key

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/quezon_central_church
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=7d
   
   # Email Configuration (Gmail SMTP)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=Quezon Central Church <your-email@gmail.com>
   
   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   
   # YouTube API Configuration
   YOUTUBE_API_KEY=your_youtube_api_key
   YOUTUBE_CHANNEL_ID=your_channel_id
   
   # Session Configuration
   SESSION_SECRET=your-session-secret-key
   ```

3. **Database Setup**
   ```bash
   npm run setup
   ```
   This creates the admin user and sample data.

4. **Start the Server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

## 🔐 Admin Access

After running the setup script, you can access the admin panel with:

- **Email**: admin@quezoncentralchurch.com
- **Password**: admin123

⚠️ **Important**: Change the default password immediately after first login!

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Admin login |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/refresh` | Refresh token |

### Contact Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/contact/submit` | Submit contact form |
| POST | `/api/contact/newsletter` | Newsletter subscription |
| GET | `/api/contact` | Get all contacts (admin) |
| PATCH | `/api/contact/:id/status` | Update contact status (admin) |

### Donation Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/donations/create-payment-intent` | Create Stripe payment intent |
| POST | `/api/donations/process` | Process donation |
| POST | `/api/donations/webhook` | Stripe webhook handler |
| GET | `/api/donations` | Get all donations (admin) |

### Sermon Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sermons` | Get all sermons (public) |
| GET | `/api/sermons/featured` | Get featured sermons |
| GET | `/api/sermons/:id` | Get single sermon |
| POST | `/api/sermons` | Create sermon (admin) |
| POST | `/api/sermons/fetch-youtube` | Fetch from YouTube (admin) |

### Event Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | Get all events (public) |
| GET | `/api/events/featured` | Get featured events |
| GET | `/api/events/:id` | Get single event |
| POST | `/api/events` | Create event (admin) |
| POST | `/api/events/:id/register` | Register for event |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Dashboard overview |
| GET | `/api/admin/stats` | System statistics |
| GET | `/api/admin/health` | System health check |
| GET | `/api/admin/settings` | System settings |

## 🔧 Configuration Guide

### Email Setup (Gmail)

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use the generated password in `EMAIL_PASS`

### Stripe Setup

1. Create a Stripe account
2. Get your API keys from the dashboard
3. Set up webhook endpoint: `https://your-domain.com/api/donations/webhook`
4. Configure webhook events: `payment_intent.succeeded`, `payment_intent.payment_failed`

### YouTube API Setup

1. Go to Google Cloud Console
2. Create a new project
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Get your channel ID from YouTube channel URL

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/quezon_central_church
JWT_SECRET=your-production-jwt-secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
YOUTUBE_API_KEY=your_youtube_api_key
YOUTUBE_CHANNEL_ID=your_channel_id
SESSION_SECRET=your-production-session-secret
```

### Security Considerations

- Use strong, unique JWT secrets
- Enable HTTPS in production
- Set up proper CORS configuration
- Use environment variables for all secrets
- Regularly update dependencies
- Monitor API usage and logs

## 📊 Database Schema

### Users
- Authentication and role management
- Permission-based access control
- Activity tracking

### Contacts
- Contact form submissions
- Status tracking (new, read, replied, archived)
- Admin notes and responses

### Donations
- Payment processing with Stripe
- Multiple donation types
- Transaction tracking
- Receipt generation

### Sermons
- YouTube integration
- Metadata management
- View analytics
- Featured content

### Events
- Event lifecycle management
- Registration system
- Category organization
- Recurring events

## 🔍 Monitoring & Analytics

The backend includes comprehensive monitoring:

- **Health Checks**: System status monitoring
- **Statistics**: Dashboard with key metrics
- **Error Logging**: Detailed error tracking
- **Performance**: Response time monitoring
- **Security**: Rate limiting and validation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support or questions:
- Email: admin@quezoncentralchurch.com
- Create an issue in the repository

---

**🎉 Backend Integration Complete!**

All required backend tasks have been implemented:
- ✅ Email service integration
- ✅ Database setup with MongoDB
- ✅ Payment processing with Stripe
- ✅ YouTube API integration
- ✅ Secure admin authentication
- ✅ Comprehensive API endpoints
- ✅ Admin dashboard and management 