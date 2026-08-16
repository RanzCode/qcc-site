// One-time (idempotent, re-runnable) seed script for the chat AI's
// KnowledgeBase collection. Upserts by `key`, so editing this file and
// re-running `npm run seed:knowledge` safely updates existing entries
// instead of duplicating them.
//
// Content here is the verified information provided by church admin as of
// 2026-08-17. The worship schedule entry is intentionally left CONFLICTING
// (see conflictNotes) because index.html, worship.html, and contact.html's
// FAQ currently disagree - resolve the real pages, then flip its status to
// VERIFIED with the corrected structuredData (or use the "Verify" action in
// Admin Dashboard > Church AI Knowledge).
require('dotenv').config();
const mongoose = require('mongoose');

const KnowledgeBase = require('../models/KnowledgeBase');
const User = require('../models/User');

const GIVING_BASE_URL = 'https://qccqonnect.org/donate.html';

const ENTRIES = [
    {
        key: 'identity',
        title: 'Church Identity',
        category: 'CHURCH_INFORMATION',
        content: "The church's public name is Quezon City Central Church of Free Seventh-Day Adventists, founded January 1, 2016. Its legal/ministry entity, used on official bank accounts, is Revelation 12:17 Ministry Inc. Both names refer to the same church - the ministry entity is the legal registration used for banking and legal purposes, not a separate organization.",
        structuredData: {
            publicName: 'Quezon City Central Church of Free Seventh-Day Adventists',
            founded: '2016-01-01',
            legalEntity: 'Revelation 12:17 Ministry Inc.'
        },
        tags: ['founded', 'history', 'legal entity', 'ministry inc', 'name'],
        source: 'ADMIN_VERIFIED',
        status: 'VERIFIED'
    },
    {
        key: 'contact-info',
        title: 'Church Contact Information',
        category: 'CONTACT',
        content: 'Quezon City Central Church is located at 8 Colonel Salgado, Quezon City, 1102 Kalakhang Maynila, Philippines. Phone: (02) 8356-3919. Mobile: +63 923 521 1414. Email: qccfsda@gmail.com. Messenger: https://m.me/quezon.central.7.',
        structuredData: {
            address: '8 Colonel Salgado, Quezon City, 1102 Kalakhang Maynila, Philippines',
            phone: '(02) 8356-3919',
            mobile: '+63 923 521 1414',
            email: 'qccfsda@gmail.com',
            messenger: 'https://m.me/quezon.central.7',
            googleMapsUrl: 'https://maps.app.goo.gl/aeVyECg3n6mhGSww6'
        },
        // Mobile number sourced from CHURCH_INFO_TO_EDIT.md (admin reference
        // doc) - not yet published on the live site's Contact page. Confirm
        // with the church before publishing it publicly.
        tags: ['address', 'phone', 'mobile', 'email', 'messenger', 'location', 'directions', 'where'],
        source: 'ADMIN_VERIFIED',
        status: 'VERIFIED',
        sourcePage: 'contact.html'
    },
    {
        key: 'social-media',
        title: 'Church Social Media',
        category: 'SOCIAL_MEDIA',
        content: 'Follow the church on Facebook (facebook.com/share/1Aq5AoyzRJ), Instagram (@qonnectmedia), and YouTube - the main channel is @quezoncentral8764 and the music channel is @qonnectmediamusic.',
        structuredData: {
            facebook: 'https://facebook.com/share/1Aq5AoyzRJ',
            instagram: '@qonnectmedia',
            youtubeMain: '@quezoncentral8764',
            youtubeMusic: '@qonnectmediamusic'
        },
        tags: ['facebook', 'instagram', 'youtube', 'social'],
        source: 'ADMIN_VERIFIED',
        status: 'VERIFIED'
    },
    {
        // Resolved 2026-08-17: index.html and contact.html's FAQ previously
        // showed Sabbath School starting 9:15 AM and index.html showed
        // Fellowship Lunch running until 2:00 PM. Cross-referenced against
        // worship.html (which already had these times) and the admin's own
        // CHURCH_INFO_TO_EDIT.md reference doc, which agree with each other.
        // index.html and contact.html have been corrected to match. Afternoon
        // Programs remains unresolved - see the separate
        // worship-schedule-afternoon entry below.
        key: 'worship-schedule',
        title: 'Sabbath Worship Schedule (core)',
        category: 'WORSHIP_SCHEDULE',
        content: 'Sabbath School runs 8:30 AM - 10:45 AM, Divine Worship runs 11:00 AM - 12:00 PM, and Fellowship Lunch runs 12:00 PM - 1:00 PM, every Saturday. Sabbath School and Divine Worship are held in the Fellowship Hall, 2nd Floor; Fellowship Lunch is on the Ground Floor hall.',
        conflictNotes: null,
        structuredData: {
            sabbathSchool: '8:30 AM - 10:45 AM',
            divineWorship: '11:00 AM - 12:00 PM',
            fellowshipLunch: '12:00 PM - 1:00 PM',
            sabbathSchoolLocation: 'Fellowship Hall, 2nd Floor',
            divineWorshipLocation: 'Fellowship Hall, 2nd Floor',
            fellowshipLunchLocation: 'Ground Floor Hall'
        },
        tags: ['sabbath school', 'divine worship', 'service time', 'schedule', 'fellowship lunch'],
        source: 'ADMIN_VERIFIED',
        status: 'VERIFIED',
        requiresVerification: false,
        lastVerifiedAt: new Date()
    },
    {
        // Still unresolved: index.html says the general Sabbath window runs
        // 3:00 PM-Sunset, worship.html says Afternoon Programs run 3:00-5:00
        // PM, contact.html's FAQ says 2:30 PM, and the admin's own
        // CHURCH_INFO_TO_EDIT.md reference doc has a garbled row suggesting
        // 1:00-3:00 PM. Four different values from four sources - do not
        // guess. Leave CONFLICTING until an admin confirms the real time.
        key: 'worship-schedule-afternoon',
        title: 'Sabbath Afternoon Programs',
        category: 'WORSHIP_SCHEDULE',
        content: "The exact start time for Sabbath Afternoon Programs is still unconfirmed - the church's own sources disagree (values seen range from 1:00 PM to 3:00 PM), so this should not be stated as a fact until an admin verifies it.",
        conflictNotes: "index.html: general 'Every Saturday: 8:30 AM-12:00 PM | 3:00 PM-Sunset' line (not labeled as a specific program). worship.html: Afternoon Programs 3:00 PM-5:00 PM. contact.html FAQ: afternoon programs starting 2:30 PM. CHURCH_INFO_TO_EDIT.md (admin reference doc, dated 2026-06-10): a malformed table row suggesting 1:00 PM-3:00 PM, immediately followed by a separate '3:00 PM - Sunset' row of unclear meaning. Four different candidate start times across sources - do not pick one.",
        structuredData: {
            candidateStartTimes: ['1:00 PM', '2:30 PM', '3:00 PM'],
            sources: [
                { page: 'index.html', note: "general 'Every Saturday ... 3:00 PM - Sunset' line" },
                { page: 'worship.html', afternoonPrograms: '3:00 PM - 5:00 PM' },
                { page: 'contact.html FAQ', afternoonPrograms: '2:30 PM' },
                { page: 'CHURCH_INFO_TO_EDIT.md', afternoonPrograms: '1:00 PM - 3:00 PM (formatting unclear)' }
            ]
        },
        tags: ['afternoon program', 'sabbath afternoon', 'schedule'],
        source: 'OFFICIAL_WEBSITE',
        status: 'CONFLICTING',
        requiresVerification: true
    },
    {
        key: 'livestream',
        title: 'Sabbath Worship Livestream',
        category: 'LIVESTREAM',
        content: 'Watch Sabbath worship live on YouTube every Saturday, 8:30 AM until sunset (GMT+8): https://youtube.com/live/gwY1VAmuZpA. This is always the church\'s livestream address, but it is only actually broadcasting during that published Saturday window - do not claim it is live right now unless the user is asking during that window.',
        structuredData: {
            url: 'https://youtube.com/live/gwY1VAmuZpA',
            schedule: 'Every Saturday, 8:30 AM - Sunset',
            timezone: 'GMT+8'
        },
        tags: ['livestream', 'watch online', 'youtube live'],
        source: 'ADMIN_VERIFIED',
        status: 'VERIFIED'
    },
    {
        key: 'leadership',
        title: 'Church Leadership',
        category: 'LEADERSHIP',
        content: 'Pastor Erwin Rivas is the Senior Pastor, with 15+ years of service and an M.Div., focused on expository preaching and pastoral care. Elder Jay Apejas is the Church Elder, with 20+ years of service, focused on discipleship and outreach. Deacon Omel Gueruela is the Head Deacon, focused on facilities and volunteer coordination.',
        structuredData: {
            leaders: [
                { name: 'Pastor Erwin Rivas', role: 'Senior Pastor', experience: '15+ years', credential: 'M.Div.', focus: ['Expository preaching', 'Pastoral care'] },
                { name: 'Elder Jay Apejas', role: 'Church Elder', experience: '20+ years', focus: ['Discipleship', 'Outreach'] },
                { name: 'Deacon Omel Gueruela', role: 'Head Deacon', focus: ['Facilities', 'Volunteer coordination'] }
            ]
        },
        tags: ['pastor', 'elder', 'deacon', 'senior pastor', 'leadership', 'staff'],
        source: 'ADMIN_VERIFIED',
        status: 'VERIFIED'
    },
    {
        key: 'mission',
        title: 'Church Mission',
        category: 'MISSION',
        content: "The church's mission is to share the Gospel, teach the Ten Commandments, the Sanctuary message, and the Three Angels' Messages, guided by the Spirit of Prophecy (Ellen G. White).",
        tags: ['mission', 'purpose'],
        source: 'ADMIN_VERIFIED',
        status: 'VERIFIED'
    },
    {
        key: 'vision',
        title: 'Church Vision',
        category: 'VISION',
        content: "The church's vision is a Christ-centered, Spirit-led community preparing hearts for Jesus' soon return.",
        tags: ['vision'],
        source: 'ADMIN_VERIFIED',
        status: 'VERIFIED'
    },
    {
        key: 'core-values',
        title: 'Core Values',
        category: 'VALUES',
        content: "The church's core values are Love, Service, Community, Growth, Mission, and Prayer.",
        structuredData: { values: ['Love', 'Service', 'Community', 'Growth', 'Mission', 'Prayer'] },
        tags: ['values', 'core values'],
        source: 'ADMIN_VERIFIED',
        status: 'VERIFIED'
    },
    {
        key: 'core-beliefs',
        title: 'Core Beliefs Highlighted',
        category: 'BELIEFS',
        content: "The church highlights four core beliefs: the Godhead, Scripture, Salvation, and the Second Coming. For detailed doctrinal questions beyond these, encourage the visitor to speak with the pastor or church staff directly rather than guessing at official positions.",
        structuredData: { beliefs: ['The Godhead', 'Scripture', 'Salvation', 'Second Coming'] },
        tags: ['beliefs', 'doctrine', 'what we believe'],
        source: 'ADMIN_VERIFIED',
        status: 'VERIFIED'
    },
    {
        key: 'ministries',
        title: 'Church Ministries',
        category: 'MINISTRY',
        content: "The church offers six ministries: Children's Ministry, Youth Ministry, Music Ministry, Community Outreach, Bible Study Groups, and Prayer Ministry. Specific meeting times/contacts for each ministry are not yet in the knowledge base - direct interested visitors to contact the church for those details rather than guessing.",
        structuredData: { ministries: ["Children's Ministry", 'Youth Ministry', 'Music Ministry', 'Community Outreach', 'Bible Study Groups', 'Prayer Ministry'] },
        tags: ['ministry', 'ministries', 'youth', 'children', 'music', 'outreach', 'bible study', 'prayer ministry'],
        source: 'ADMIN_VERIFIED',
        status: 'VERIFIED'
    },
    {
        key: 'donation-online',
        title: 'Online Giving',
        category: 'DONATION',
        content: `The church accepts online giving at ${GIVING_BASE_URL}#online, for Tithe, Offering, Building Fund, Mission Projects, or Other, given one-time or on a weekly, monthly, or quarterly recurring basis.`,
        structuredData: {
            url: `${GIVING_BASE_URL}#online`,
            categories: ['Tithe', 'Offering', 'Building Fund', 'Mission Projects', 'Other'],
            frequencies: ['One-time', 'Weekly', 'Monthly', 'Quarterly']
        },
        tags: ['donate', 'give', 'online giving', 'tithe', 'offering', 'building fund', 'mission projects', 'recurring'],
        source: 'ADMIN_VERIFIED',
        status: 'VERIFIED'
    },
    {
        key: 'donation-bank',
        title: 'Bank Transfer Donation',
        category: 'DONATION',
        content: 'The church accepts bank transfer donations via BDO, account name REVELATION 12:17 MINISTRY INC., account number 004690157114. This is the church\'s official, permanent giving account.',
        structuredData: {
            method: 'BANK_TRANSFER',
            bank: 'BDO',
            accountName: 'REVELATION 12:17 MINISTRY INC.',
            accountNumber: '004690157114',
            donationStatus: 'ACTIVE',
            sensitiveFinancialData: true
        },
        tags: ['bank', 'bdo', 'bank transfer', 'account number', 'tithe', 'offering'],
        source: 'ADMIN_VERIFIED',
        status: 'VERIFIED'
    },
    {
        key: 'donation-gcash',
        title: 'GCash Donation (Temporary)',
        category: 'DONATION',
        content: "The church website currently lists a temporary GCash option using a personal account (displayed as \"ER••N R.\") while the official church GCash account is being set up. Because this is a temporary, personal arrangement rather than a permanent official church account, always identify it as temporary when mentioning it, and advise the user to verify the latest GCash instructions with the church before sending a donation. Donors should include a note specifying the purpose (e.g. Tithes, Offerings, Community Outreach) in the transaction.",
        structuredData: {
            method: 'GCASH',
            displayedName: 'ER••N R.',
            donationStatus: 'TEMPORARY',
            reason: 'Pending official church account setup'
        },
        tags: ['gcash', 'qr code', 'mobile payment'],
        source: 'ADMIN_VERIFIED',
        status: 'VERIFIED'
    },
    {
        key: 'donation-mail',
        title: 'Mail-In Donation',
        category: 'DONATION',
        content: 'The church accepts tithes and offerings mailed as a check to: Quezon Central Church, 8 Colonel Salgado, Quezon City, 1102 Kalakhang Maynila, Philippines.',
        structuredData: { method: 'MAIL', address: '8 Colonel Salgado, Quezon City, 1102 Kalakhang Maynila, Philippines' },
        tags: ['mail', 'check', 'mail a check'],
        source: 'ADMIN_VERIFIED',
        status: 'VERIFIED'
    },
    {
        key: 'donation-in-person',
        title: 'In-Person Donation',
        category: 'DONATION',
        content: 'You can give in person during Sabbath worship services - offering plates are passed during the designated time, and envelopes are available for those who want to designate their gift for a specific purpose.',
        structuredData: { method: 'IN_PERSON', options: ['Offering plates during service', 'Envelopes for designated gifts'] },
        tags: ['in person', 'offering plate', 'envelope', 'cash'],
        source: 'ADMIN_VERIFIED',
        status: 'VERIFIED'
    },
    {
        key: 'events-overview',
        title: 'Events & Calendar',
        category: 'EVENT',
        content: "The church publishes its calendar via Google Calendar (mediaqonnect@gmail.com, Asia/Manila timezone). Standing event categories include Community Outreach, Youth Fellowship, Midweek Bible Study, Prayer Meeting, Church Family Day, and Health & Wellness Seminar. The event cards on the website currently do not have working \"View Details\"/\"Register Now\" links - do not invent a registration URL; if someone wants to register, direct them to contact the church through Messenger, email, or phone. For specific upcoming dates, rely on the live event data provided for this query rather than this note.",
        structuredData: {
            googleCalendarEmail: 'mediaqonnect@gmail.com',
            timezone: 'Asia/Manila',
            standingCategories: ['Community Outreach', 'Youth Fellowship', 'Midweek Bible Study', 'Prayer Meeting', 'Church Family Day', 'Health & Wellness Seminar'],
            registrationLinksConfigured: false
        },
        tags: ['events', 'calendar', 'church camp', 'register', 'registration'],
        source: 'ADMIN_VERIFIED',
        status: 'VERIFIED'
    },
    {
        key: 'faq-membership',
        title: 'FAQ: Becoming a Member',
        category: 'FAQ',
        content: 'New members are welcomed through baptism, profession of faith, or transfer from another church. Interested visitors should contact the church office or speak with the pastor for next steps.',
        tags: ['membership', 'become a member', 'baptism', 'join'],
        source: 'OFFICIAL_WEBSITE',
        status: 'VERIFIED',
        sourcePage: 'contact.html'
    },
    {
        key: 'faq-children',
        title: 'FAQ: Programs for Children',
        category: 'FAQ',
        content: 'Yes - the church offers age-appropriate Sabbath School classes for children of all ages, along with youth programs and activities throughout the week.',
        tags: ['children', 'kids', 'youth program'],
        source: 'OFFICIAL_WEBSITE',
        status: 'VERIFIED',
        sourcePage: 'contact.html'
    },
    {
        key: 'faq-get-involved',
        title: 'FAQ: Getting Involved',
        category: 'FAQ',
        content: 'Visitors can get involved by joining a ministry team, volunteering for community service, participating in Bible study groups, or helping with church programs - contact the church office to learn about current opportunities.',
        tags: ['volunteer', 'get involved', 'serve'],
        source: 'OFFICIAL_WEBSITE',
        status: 'VERIFIED',
        sourcePage: 'contact.html'
    }
];

async function connectDB() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 MongoDB Connected');
}

async function run() {
    await connectDB();

    const admin = await User.findOne({ role: 'admin' });
    const attribution = admin ? { createdBy: admin._id, lastUpdatedBy: admin._id } : {};

    let created = 0;
    let updated = 0;

    for (const entry of ENTRIES) {
        const existed = await KnowledgeBase.exists({ key: entry.key });

        await KnowledgeBase.findOneAndUpdate(
            { key: entry.key },
            { $set: { ...entry, ...attribution } },
            { upsert: true, setDefaultsOnInsert: true }
        );

        if (existed) updated += 1; else created += 1;
    }

    console.log(`✅ Knowledge base seeded: ${created} created, ${updated} updated (${ENTRIES.length} total entries)`);
    process.exit(0);
}

run().catch((error) => {
    console.error('❌ Knowledge base seed failed:', error);
    process.exit(1);
});
