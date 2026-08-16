// One-time (idempotent) seed script: creates the 3 authorized admin accounts
// with random passwords, and seeds the Post/SabbathSchool collections with
// the content that used to be hardcoded in the static HTML, so the live
// site doesn't regress on first deploy.
require('dotenv').config();
const crypto = require('crypto');
const mongoose = require('mongoose');

const User = require('../models/User');
const Post = require('../models/Post');
const SabbathSchool = require('../models/SabbathSchool');
const { detectPlatform, normalizeGoogleSlidesUrl } = require('../utils/embedUtils');

const ADMIN_EMAILS = [
    'saluague.f.bscs@gmail.com',
    'mediaqonnect@gmail.com',
    'hizonsmarketing@gmail.com'
];

const EXISTING_FB_POSTS = [
    'https://www.facebook.com/quezon.central.7/posts/pfbid02HYmSN3b5kveMuYbaWsfFpMX5PejPJxUZGcQni9E2ontH1sDhFC3ZZPMfdkv6RJUXl',
    'https://www.facebook.com/quezon.central.7/posts/pfbid0nd5fifMG9KBaTQYyJ9e7TFt6ZD5xC7mS7src3emoxw9DVmbxTkinuhPq8EneGN6Fl'
];

const EXISTING_SLIDE_URLS = [
    'https://docs.google.com/presentation/d/e/2PACX-1vQBQabKYH7IZYXFynueTafYCdCebHbjbHjLiGaCt-FDGfqNMqG5xUPSjDxtuAhxxGUIkUuMrzwLEG_t/pubembed?start=false&loop=false&delayms=60000',
    'https://docs.google.com/presentation/d/e/2PACX-1vQXz5dDjbHmmWlbbBDU0mwORcS5bZIOce8ek4VizbCo4WT6Q2Loi6tz_G1i7FmpHFzWrOf3bSWkHQnA/pubembed?start=true&loop=false&delayms=3000',
    'https://docs.google.com/presentation/d/1WwCNXO142Gk-i3bhqwfM2ec9Y9Y-EV5wnlNvTdN-3HY/embed?start=false&loop=false&delayms=3000'
];

const ALL_PERMISSIONS_TRUE = {
    events: true,
    sermons: true,
    donations: true,
    users: true,
    announcements: true,
    posts: true,
    sabbathSchool: true,
    stories: true,
    contacts: true,
    knowledge: true,
    conversations: true
};

async function connectDB() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 MongoDB Connected');
}

async function seedAdmins() {
    const created = [];

    for (const email of ADMIN_EMAILS) {
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            console.log(`✅ Admin already exists: ${email}`);
            continue;
        }

        const password = crypto.randomBytes(12).toString('base64url');
        const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').slice(0, 30) || `admin${Date.now()}`;

        const user = new User({
            username,
            email,
            password,
            firstName: 'Admin',
            lastName: username,
            role: 'admin',
            isActive: true,
            permissions: ALL_PERMISSIONS_TRUE
        });

        await user.save();
        created.push({ email, username, password });
    }

    if (created.length) {
        console.log('\n⚠️  SAVE THESE CREDENTIALS NOW — they will not be shown again:\n');
        created.forEach(({ email, username, password }) => {
            console.log(`  Email: ${email}\n  Username: ${username}\n  Password: ${password}\n`);
        });
    }

    return created;
}

async function seedPosts(createdByUserId) {
    const count = await Post.countDocuments();
    if (count > 0) {
        console.log('✅ Posts already seeded, skipping');
        return;
    }

    const docs = EXISTING_FB_POSTS.map((url, index) => {
        const { platform, embedUrl } = detectPlatform(url);
        return {
            url,
            platform,
            embedUrl,
            order: index + 1,
            isActive: true,
            createdBy: createdByUserId,
            lastUpdatedBy: createdByUserId
        };
    });

    await Post.insertMany(docs);
    console.log(`✅ Seeded ${docs.length} posts`);
}

async function seedSabbathSchool(createdByUserId) {
    const count = await SabbathSchool.countDocuments();
    if (count > 0) {
        console.log('✅ Sabbath School slides already seeded, skipping');
        return;
    }

    const docs = EXISTING_SLIDE_URLS.map((slideUrl, index) => ({
        title: `Sabbath School Lesson ${index + 1}`,
        slideUrl,
        embedUrl: normalizeGoogleSlidesUrl(slideUrl),
        order: index + 1,
        isActive: true,
        createdBy: createdByUserId,
        lastUpdatedBy: createdByUserId
    }));

    await SabbathSchool.insertMany(docs);
    console.log(`✅ Seeded ${docs.length} Sabbath School slides`);
}

async function run() {
    await connectDB();
    await seedAdmins();

    const anyAdmin = await User.findOne({ email: { $in: ADMIN_EMAILS } });
    if (anyAdmin) {
        await seedPosts(anyAdmin._id);
        await seedSabbathSchool(anyAdmin._id);
    }

    console.log('\n✅ Seed complete');
    process.exit(0);
}

run().catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
});
