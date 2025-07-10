const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
    return nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};

// Email templates
const emailTemplates = {
    contactForm: (data) => ({
        subject: `New Contact Form Submission - ${data.subject}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1F2937;">New Contact Form Submission</h2>
                <div style="background-color: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>From:</strong> ${data.firstName} ${data.lastName}</p>
                    <p><strong>Email:</strong> ${data.email}</p>
                    <p><strong>Phone:</strong> ${data.phone || 'Not provided'}</p>
                    <p><strong>Subject:</strong> ${data.subject}</p>
                    <p><strong>Message:</strong></p>
                    <div style="background-color: white; padding: 15px; border-radius: 4px; margin-top: 10px;">
                        ${data.message.replace(/\n/g, '<br>')}
                    </div>
                </div>
                <p style="color: #6B7280; font-size: 14px;">
                    This message was sent from the Quezon Central Church website contact form.
                </p>
            </div>
        `
    }),
    
    newsletterSubscription: (email) => ({
        subject: 'Welcome to Quezon Central Church Newsletter',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1F2937;">Welcome to Our Newsletter!</h2>
                <p>Thank you for subscribing to the Quezon Central Church newsletter. You'll now receive updates about:</p>
                <ul style="color: #374151;">
                    <li>Church events and activities</li>
                    <li>Sermon announcements</li>
                    <li>Community outreach programs</li>
                    <li>Spiritual growth resources</li>
                </ul>
                <p>If you have any questions, please don't hesitate to contact us.</p>
                <p style="color: #6B7280; font-size: 14px;">
                    To unsubscribe, reply to this email with "UNSUBSCRIBE" in the subject line.
                </p>
            </div>
        `
    }),
    
    donationConfirmation: (data) => ({
        subject: 'Thank You for Your Donation - Quezon Central Church',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1F2937;">Thank You for Your Generosity!</h2>
                <div style="background-color: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Donation Type:</strong> ${data.donationType}</p>
                    <p><strong>Amount:</strong> ₱${data.amount}</p>
                    <p><strong>Frequency:</strong> ${data.frequency}</p>
                    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
                <p>Your donation helps us continue our mission of serving the community through faith, love, and compassion.</p>
                <p>May God bless you abundantly!</p>
            </div>
        `
    }),
    
    prayerRequest: (data) => ({
        subject: 'Prayer Request Received - Quezon Central Church',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1F2937;">Prayer Request Received</h2>
                <p>Thank you for sharing your prayer request with us. Our prayer team has been notified and will be praying for you.</p>
                <div style="background-color: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>From:</strong> ${data.firstName} ${data.lastName}</p>
                    <p><strong>Prayer Request:</strong></p>
                    <div style="background-color: white; padding: 15px; border-radius: 4px; margin-top: 10px;">
                        ${data.message.replace(/\n/g, '<br>')}
                    </div>
                </div>
                <p>"For where two or three gather in my name, there am I with them." - Matthew 18:20</p>
            </div>
        `
    })
};

// Send email function
const sendEmail = async (to, template, data = {}) => {
    try {
        const transporter = createTransporter();
        const emailContent = emailTemplates[template](data);
        
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: to,
            subject: emailContent.subject,
            html: emailContent.html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Email sending failed:', error);
        return { success: false, error: error.message };
    }
};

// Send contact form notification
const sendContactNotification = async (formData) => {
    const adminEmail = process.env.EMAIL_USER; // Send to admin
    return await sendEmail(adminEmail, 'contactForm', formData);
};

// Send newsletter subscription confirmation
const sendNewsletterConfirmation = async (email) => {
    return await sendEmail(email, 'newsletterSubscription');
};

// Send donation confirmation
const sendDonationConfirmation = async (email, donationData) => {
    return await sendEmail(email, 'donationConfirmation', donationData);
};

// Send prayer request confirmation
const sendPrayerRequestConfirmation = async (email, prayerData) => {
    return await sendEmail(email, 'prayerRequest', prayerData);
};

module.exports = {
    sendEmail,
    sendContactNotification,
    sendNewsletterConfirmation,
    sendDonationConfirmation,
    sendPrayerRequestConfirmation
}; 