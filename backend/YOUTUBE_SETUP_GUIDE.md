# YouTube API Setup Guide for Multiple Channels

## 🎯 Overview

You can use **ONE YouTube API key** for multiple channels and playlists. The API key is tied to your Google Cloud project, not individual channels.

## 📋 Required Setup

### 1. **Single YouTube API Key** (Required)
- Create ONE API key in Google Cloud Console
- This key will work for all your channels and playlists
- No need for separate API keys

### 2. **YouTube Channel Structure**

#### **Main Church Channel** (Same account)
- **Channel ID**: Your main church YouTube channel
- **Sermons Playlist**: Create a playlist for sermons
- **Sabbath School Playlist**: Create a playlist for Sabbath School lessons

#### **Music Media Channel** (Different account)
- **Channel ID**: Different YouTube account for music
- **Music Playlist**: Create a playlist for music content

## 🛠️ Step-by-Step Setup

### **Step 1: Create YouTube API Key**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable YouTube Data API v3:
   - APIs & Services → Library
   - Search for "YouTube Data API v3"
   - Click "Enable"
4. Create credentials:
   - APIs & Services → Credentials
   - Click "Create Credentials" → "API Key"
   - Copy the API key

### **Step 2: Get Channel IDs**

#### **Main Church Channel**
1. Go to your main church YouTube channel
2. URL format: `https://www.youtube.com/channel/CHANNEL_ID`
3. Copy the channel ID from the URL

#### **Music Media Channel**
1. Go to your music YouTube channel
2. Copy the channel ID from the URL

### **Step 3: Create Playlists**

#### **Sermons Playlist**
1. On main church channel, create a new playlist
2. Name it "Sermons" or "Church Sermons"
3. Add your sermon videos to this playlist
4. Get playlist ID from URL: `https://www.youtube.com/playlist?list=PLAYLIST_ID`

#### **Sabbath School Playlist**
1. Create another playlist on main channel
2. Name it "Sabbath School Lessons"
3. Add Sabbath School videos to this playlist
4. Get playlist ID from URL

#### **Music Playlist**
1. On music channel, create a playlist
2. Name it "Church Music" or "Worship Music"
3. Add music videos to this playlist
4. Get playlist ID from URL

### **Step 4: Configure Environment Variables**

Edit your `.env` file:

```env
# YouTube API Configuration (Single API Key for all channels)
YOUTUBE_API_KEY=your_single_api_key_here

# Main Church Channel (Sermons & Sabbath School)
YOUTUBE_CHANNEL_ID=your_main_channel_id
YOUTUBE_SERMONS_PLAYLIST_ID=your_sermons_playlist_id
YOUTUBE_SABBATH_SCHOOL_PLAYLIST_ID=your_sabbath_school_playlist_id

# Music Media Channel (Different account)
YOUTUBE_MUSIC_CHANNEL_ID=your_music_channel_id
YOUTUBE_MUSIC_PLAYLIST_ID=your_music_playlist_id
```

## 📊 Content Organization

### **Sermons** (Main Channel)
- **Playlist**: Sermons
- **Content**: Weekly sermons, special messages
- **Auto-sync**: Fetches from sermons playlist

### **Sabbath School** (Main Channel)
- **Playlist**: Sabbath School Lessons
- **Content**: Weekly lessons, Bible studies
- **Auto-sync**: Fetches from Sabbath School playlist

### **Music Media** (Different Channel)
- **Playlist**: Church Music
- **Content**: Hymns, worship songs, choir performances
- **Auto-sync**: Fetches from music playlist

## 🔄 Auto-Sync Features

### **Sermons Sync**
```bash
POST /api/sermons/fetch-youtube
```
- Fetches from main channel's sermons playlist
- Creates sermon records automatically
- Updates existing sermons with new data

### **Sabbath School Sync**
```bash
POST /api/sabbath-school/fetch-youtube
```
- Fetches from main channel's Sabbath School playlist
- Creates lesson records automatically
- Organizes by quarter and year

### **Music Media Sync**
```bash
POST /api/music-media/fetch-youtube
```
- Fetches from music channel's playlist
- Creates music records automatically
- Categorizes by type (hymn, worship, etc.)

## 📱 API Endpoints

### **Sermons**
- `GET /api/sermons` - Get all sermons
- `GET /api/sermons/featured` - Get featured sermons
- `POST /api/sermons/fetch-youtube` - Sync from YouTube

### **Sabbath School**
- `GET /api/sabbath-school` - Get all lessons
- `GET /api/sabbath-school/featured` - Get featured lessons
- `POST /api/sabbath-school/fetch-youtube` - Sync from YouTube

### **Music Media**
- `GET /api/music-media` - Get all music
- `GET /api/music-media/featured` - Get featured music
- `POST /api/music-media/fetch-youtube` - Sync from YouTube

## 🎯 Benefits of This Setup

### **Single API Key**
- ✅ One API key for all channels
- ✅ Easier to manage and monitor
- ✅ Cost-effective (one API quota)

### **Organized Content**
- ✅ Sermons and Sabbath School on main channel
- ✅ Music on separate channel
- ✅ Playlists for easy organization
- ✅ Automatic categorization

### **Flexible Management**
- ✅ Different channels for different content types
- ✅ Separate playlists for easy management
- ✅ Auto-sync keeps content updated
- ✅ Admin can manage all content types

## 🔧 Troubleshooting

### **API Quota Issues**
- YouTube API has daily quotas
- Monitor usage in Google Cloud Console
- Consider upgrading if needed

### **Playlist Access**
- Ensure playlists are public or unlisted
- Check playlist IDs are correct
- Verify channel IDs are accurate

### **Content Organization**
- Use consistent naming in playlists
- Add proper descriptions to videos
- Use tags for better categorization

## 📈 Best Practices

### **Content Management**
1. **Consistent Upload Schedule**: Upload sermons weekly
2. **Proper Titles**: Use descriptive titles for videos
3. **Good Descriptions**: Add scripture references and summaries
4. **Tags**: Use relevant tags for better organization

### **Playlist Organization**
1. **Sermons**: Include date and preacher name in titles
2. **Sabbath School**: Include lesson number and quarter
3. **Music**: Include song title and artist/group

### **Auto-Sync Strategy**
1. **Weekly Sync**: Run sync weekly for new content
2. **Review Drafts**: Check imported content before publishing
3. **Update Metadata**: Add proper titles, descriptions, and tags

## 🚀 Getting Started

1. **Set up your YouTube channels and playlists**
2. **Get your API key and channel/playlist IDs**
3. **Configure your `.env` file**
4. **Run the setup script**: `npm run setup`
5. **Test the sync**: Use the admin panel to sync content
6. **Review and publish**: Check imported content and publish

---

**🎉 You're all set!** One API key will handle all your YouTube content across multiple channels and playlists. 

## 🎯 **Answer to Your Question**

**No, you do NOT need different API keys!** Here's the complete setup:

### **✅ Single API Key Solution**

You can use **ONE YouTube API key** for all your channels and playlists. The API key is tied to your Google Cloud project, not individual channels.

### **📋 Your Setup Structure**

#### **Main Church Channel** (Same account)
- **Sermons Playlist**: `YOUTUBE_SERMONS_PLAYLIST_ID`
- **Sabbath School Playlist**: `YOUTUBE_SABBATH_SCHOOL_PLAYLIST_ID`
- **Channel ID**: `YOUTUBE_CHANNEL_ID`

#### **Music Media Channel** (Different account)
- **Music Playlist**: `YOUTUBE_MUSIC_PLAYLIST_ID`
- **Channel ID**: `YOUTUBE_MUSIC_CHANNEL_ID`

### **🔧 Environment Configuration**

```env
# YouTube API Configuration (Single API Key for all channels)
YOUTUBE_API_KEY=your_single_api_key_here

# Main Church Channel (Sermons & Sabbath School)
YOUTUBE_CHANNEL_ID=your_main_channel_id
YOUTUBE_SERMONS_PLAYLIST_ID=your_sermons_playlist_id
YOUTUBE_SABBATH_SCHOOL_PLAYLIST_ID=your_sabbath_school_playlist_id

# Music Media Channel (Different account)
YOUTUBE_MUSIC_CHANNEL_ID=your_music_channel_id
YOUTUBE_MUSIC_PLAYLIST_ID=your_music_playlist_id
```

### ** Auto-Sync Features**

- **Sermons**: Syncs from main channel's sermons playlist
- **Sabbath School**: Syncs from main channel's Sabbath School playlist  
- **Music Media**: Syncs from music channel's playlist

### **📊 Benefits**

✅ **One API key** for all channels  
✅ **Organized content** with separate playlists  
✅ **Automatic categorization** by content type  
✅ **Easy management** through admin panel  
✅ **Cost-effective** (single API quota)  

### **🚀 Next Steps**

1. **Create your YouTube playlists** for each content type
2. **Get your single API key** from Google Cloud Console
3. **Configure the environment variables** with your IDs
4. **Run the setup**: `npm run setup`
5. **Test the sync** from the admin panel

The backend is now fully configured to handle multiple YouTube channels and playlists with a single API key! 🎉 