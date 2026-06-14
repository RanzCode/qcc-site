const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📦 MongoDB Connected');
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
};

const createAdminUser = async () => {
    try {
        // Check if admin user already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        
        if (existingAdmin) {
            console.log('✅ Admin user already exists');
            return;
        }

        // Create admin user
        const adminUser = new User({
            username: 'admin',
            email: 'admin@quezoncentralchurch.com',
            password: 'admin123', // Change this in production
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin',
            permissions: {
                events: true,
                sermons: true,
                donations: true,
                users: true,
                announcements: true
            }
        });

        await adminUser.save();
        console.log('✅ Admin user created successfully');
        console.log('📧 Email: admin@quezoncentralchurch.com');
        console.log('🔑 Password: admin123');
        console.log('⚠️  Please change the password after first login!');
    } catch (error) {
        console.error('❌ Failed to create admin user:', error);
    }
};

const createSampleData = async () => {
    try {
        // Create sample events
        const Event = require('../models/Event');
        const Sermon = require('../models/Sermon');
        const SabbathSchool = require('../models/SabbathSchool');
        const MusicMedia = require('../models/MusicMedia');
        const Contact = require('../models/Contact');

        // Check if sample data already exists
        const existingEvents = await Event.countDocuments();
        const existingSermons = await Sermon.countDocuments();
        const existingSabbathSchool = await SabbathSchool.countDocuments();
        const existingMusicMedia = await MusicMedia.countDocuments();
        const existingContacts = await Contact.countDocuments();

        if (existingEvents === 0) {
            const sampleEvents = [
                {
                    title: 'Sabbath Worship Service',
                    description: 'Join us for our weekly Sabbath worship service featuring inspiring music, prayer, and a powerful message.',
                    shortDescription: 'Weekly Sabbath worship service',
                    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
                    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours later
                    startTime: '11:00 AM',
                    endTime: '1:00 PM',
                    location: 'Main Sanctuary',
                    address: '8 Colonel Salgado, Quezon City',
                    category: 'worship',
                    type: 'recurring',
                    status: 'published',
                    isFeatured: true,
                    createdBy: (await User.findOne({ role: 'admin' }))._id
                },
                {
                    title: 'Youth Bible Study',
                    description: 'A dynamic Bible study session designed specifically for young adults and teenagers.',
                    shortDescription: 'Bible study for youth',
                    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
                    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000), // 1.5 hours later
                    startTime: '7:00 PM',
                    endTime: '8:30 PM',
                    location: 'Youth Room',
                    address: '8 Colonel Salgado, Quezon City',
                    category: 'youth',
                    type: 'recurring',
                    status: 'published',
                    createdBy: (await User.findOne({ role: 'admin' }))._id
                }
            ];

            await Event.insertMany(sampleEvents);
            console.log('✅ Sample events created');
        }

        if (existingSermons === 0) {
            const sampleSermons = [
                {
                    title: 'Walking in Faith',
                    preacher: 'Pastor Erwin Rivas',
                    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last week
                    scripture: 'Hebrews 11:1-6',
                    description: 'A powerful message about the importance of faith in our daily walk with God.',
                    summary: 'This sermon explores how faith is the foundation of our relationship with God and how it guides us through life\'s challenges.',
                    tags: ['faith', 'trust', 'guidance'],
                    status: 'published',
                    isFeatured: true,
                    createdBy: (await User.findOne({ role: 'admin' }))._id
                },
                {
                    title: 'The Power of Prayer',
                    preacher: 'Pastor Erwin Rivas',
                    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
                    scripture: 'Philippians 4:6-7',
                    description: 'Discover the transformative power of prayer and how it can change your life.',
                    summary: 'This message teaches us how prayer connects us with God and brings peace to our hearts.',
                    tags: ['prayer', 'peace', 'connection'],
                    status: 'published',
                    createdBy: (await User.findOne({ role: 'admin' }))._id
                }
            ];

            await Sermon.insertMany(sampleSermons);
            console.log('✅ Sample sermons created');
        }

        if (existingSabbathSchool === 0) {
            const sampleSabbathSchool = [
                {
                    title: 'Lesson 1: The Beginning of the Gospel',
                    lessonNumber: 1,
                    quarter: 'Q1',
                    year: 2024,
                    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    scripture: 'Mark 1:1-8',
                    description: 'An introduction to the Gospel of Mark and the ministry of John the Baptist.',
                    summary: 'This lesson explores the beginning of the gospel and the role of John the Baptist as the forerunner of Christ.',
                    tags: ['gospel', 'mark', 'john the baptist'],
                    status: 'published',
                    isFeatured: true,
                    createdBy: (await User.findOne({ role: 'admin' }))._id
                },
                {
                    title: 'Lesson 2: The Baptism and Temptation',
                    lessonNumber: 2,
                    quarter: 'Q1',
                    year: 2024,
                    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
                    scripture: 'Mark 1:9-13',
                    description: 'Exploring the baptism of Jesus and His temptation in the wilderness.',
                    summary: 'This lesson examines the significance of Jesus\' baptism and His victory over temptation.',
                    tags: ['baptism', 'temptation', 'wilderness'],
                    status: 'published',
                    createdBy: (await User.findOne({ role: 'admin' }))._id
                }
            ];

            await SabbathSchool.insertMany(sampleSabbathSchool);
            console.log('✅ Sample Sabbath School lessons created');
        }

        if (existingMusicMedia === 0) {
            const sampleMusicMedia = [
                {
                    title: 'Amazing Grace',
                    artist: 'Church Choir',
                    category: 'hymn',
                    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    description: 'A beautiful rendition of the classic hymn Amazing Grace.',
                    lyrics: 'Amazing grace, how sweet the sound...',
                    tags: ['hymn', 'grace', 'classic'],
                    status: 'published',
                    isFeatured: true,
                    createdBy: (await User.findOne({ role: 'admin' }))._id
                },
                {
                    title: 'How Great Thou Art',
                    artist: 'Worship Team',
                    category: 'worship',
                    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
                    description: 'A powerful worship song celebrating God\'s greatness.',
                    lyrics: 'O Lord my God, when I in awesome wonder...',
                    tags: ['worship', 'praise', 'greatness'],
                    status: 'published',
                    createdBy: (await User.findOne({ role: 'admin' }))._id
                }
            ];

            await MusicMedia.insertMany(sampleMusicMedia);
            console.log('✅ Sample music media created');
        }

        if (existingContacts === 0) {
            const sampleContacts = [
                {
                    firstName: 'Maria',
                    lastName: 'Santos',
                    email: 'maria.santos@example.com',
                    phone: '+63 912 345 6789',
                    subject: 'prayer',
                    message: 'Please pray for my family during this difficult time. We are facing some challenges and need God\'s guidance.',
                    status: 'new'
                },
                {
                    firstName: 'Juan',
                    lastName: 'Dela Cruz',
                    email: 'juan.delacruz@example.com',
                    phone: '+63 923 456 7890',
                    subject: 'membership',
                    message: 'I would like to learn more about becoming a member of your church. Could you please provide information about the membership process?',
                    status: 'read'
                }
            ];

            await Contact.insertMany(sampleContacts);
            console.log('✅ Sample contacts created');
        }

    } catch (error) {
        console.error('❌ Failed to create sample data:', error);
    }
};

const setup = async () => {
    console.log('🚀 Starting setup...');
    
    await connectDB();
    await createAdminUser();
    await createSampleData();
    
    console.log('✅ Setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Start the server: npm start');
    console.log('2. Access the admin panel');
    console.log('3. Change the default admin password');
    console.log('4. Configure your environment variables');
    
    process.exit(0);
};

setup(); 