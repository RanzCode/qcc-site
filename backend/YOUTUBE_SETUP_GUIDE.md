# YouTube API Setup Guide for Multiple Channels

## 🎯 Overview

You can use **ONE YouTube API key** for multiple channels and playlists. The API key is tied to your Google Cloud project, not individual channels.

## 📋 Required Setup

### 1. **Single YouTube API Key** (Required)✅
- Create ONE API key in Google Cloud Console✅
- This key will work for all your channels and playlists✅
- No need for separate API keys✅

### 2. **YouTube Channel Structure**

#### **Main Church Channel** (Same account)✅
- **Channel ID**: Your main church YouTube channel✅
- **Sermons Playlist**: Create a playlist for sermons✅
- **Sabbath School Playlist**: Create a playlist for Sabbath School lessons✅

#### **Music Media Channel** (Different account)✅
- **Channel ID**: Different YouTube account for music✅
- **Music Playlist**: Create a playlist for music content✅

## 🛠️ Step-by-Step Setup

### **Step 1: Create YouTube API Key**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)✅
2. Create a new project or select existing one✅
3. Enable YouTube Data API v3:
   - APIs & Services → Library
   - Search for "YouTube Data API v3"
   - Click "Enable"✅
4. Create credentials:
   - APIs & Services → Credentials✅
   - Click "Create Credentials" → "API Key"✅
   - Copy the API key✅

### **Step 2: Get Channel IDs**

#### **Main Church Channel**
1. Go to your main church YouTube channel✅
2. URL format: `https://www.youtube.com/channel/CHANNEL_ID`✅
3. Copy the channel ID from the URL✅

#### **Music Media Channel**
1. Go to your music YouTube channel
2. Copy the channel ID from the URL

### **Step 3: Create Playlists**

#### **Sermons Playlist**
1. On main church channel, create a new playlist
2. Name it "Sermons" or "Church Sermons"
3. Add your sermon videos to this playlist
4. Get playlist ID from URL: `https://www.youtube.com/playlist?list=PL615tmMR_c6UIx4yXrDinZCcfiS1BOTsV`

#### **Sabbath School Playlist**
1. Create another playlist on main channel
2. Name it "Sabbath School Lessons"
3. Add Sabbath School videos to this playlist
4. Get playlist ID from URL: `https://www.youtube.com/playlist?list=PL615tmMR_c6X0KfJvu07enaghDhdgYRFe` 

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

---

Here’s exactly what you need to do to sync your YouTube videos and make them visible on your website:

---

## 1. **Login as Admin to Get a JWT Token**

You need to be an admin/editor to trigger the sync endpoints.  
**POST** to `/api/auth/login` with your admin credentials:

**Example `curl`:**
```sh
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@quezoncentralchurch.com","password":"admin123"}'
```
- This will return a JSON with a `token` field. Copy that token.

---

## 2. **Trigger YouTube Sync for Each Section**

Replace `<YOUR_TOKEN>` with the token you got above.

### **Sermons**
```sh
curl -X POST http://localhost:3000/api/sermons/fetch-youtube \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"maxResults": 10}'
```

### **Sabbath School Lessons**
```sh
curl -X POST http://localhost:3000/api/sabbath-school/fetch-youtube \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"maxResults": 10}'
```

### **Music Media**
```sh
curl -X POST http://localhost:3000/api/music-media/fetch-youtube \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"maxResults": 10}'
```

---

## 3. **Check the Data**

- Visit these endpoints in your browser or Postman:
  - `http://localhost:3000/api/sermons`
  - `http://localhost:3000/api/sabbath-school`
  - `http://localhost:3000/api/music-media`
- You should see real YouTube video data.

---

## 4. **Reload Your Website**

- Refresh your homepage.
- You should now see real video thumbnails, titles, and links for each section.

---

**If you get any errors or need help with a specific step, let me know what the error is and I’ll help you fix it!** 

Absolutely! Here’s a **step-by-step guide to set up MongoDB locally** and connect it to your project using MongoDB Compass and your Node.js backend.

---

## **Step 1: Make Sure MongoDB is Installed and Running**

1. **Install MongoDB**  
   - If you haven’t already, download and install MongoDB Community Server from [here](https://www.mongodb.com/try/download/community).
   - During installation, choose to **install MongoDB as a service** (the default option you saw earlier).

2. **Start the MongoDB Service**  
   - MongoDB should start automatically as a Windows service.
   - To check, open **Task Manager** and look for `mongod.exe` or check **Services** for "MongoDB".

---

## **Step 2: Connect to MongoDB Using Compass**

1. **Open MongoDB Compass** (as shown in your screenshot).
2. **Click “Add new connection”**.
3. In the “Connection String” field, enter:
   ```
   mongodb://localhost:27017
   ```
4. **Click “Connect”**.

- You should now see your local MongoDB server and be able to browse databases.

---

## **Step 3: Verify/Create Your Database**

1. In Compass, after connecting, you can create a new database if you want, but your Node.js app will automatically create `quezon_central_church` when it runs.
2. You can browse collections and documents here.

---

## **Step 4: Check Your Node.js Project’s .env File**

Make sure your `.env` file has:
```
MONGODB_URI=mongodb://localhost:27017/quezon_central_church
```
- This tells your backend to use the local MongoDB server and the `quezon_central_church` database.

---

## **Step 5: Start Your Backend Server**

1. In your project’s `backend` folder, run:
   ```sh
   npm run dev
   ```
   or
   ```sh
   npm start
   ```
2. You should see a message like:
   ```
   🚀 Server running on port 3000
   📧 Email service: Configured
   💳 Payment processing: Configured
   📺 YouTube API: Configured
   ```

---

## **Step 6: Test the Connection**

- If your backend starts without errors, MongoDB is working!
- If you see errors, make sure:
  - MongoDB is running (check Services or Task Manager).
  - The connection string in `.env` is correct.
  - No firewall or antivirus is blocking port 27017.

---

## **Step 7: (Optional) Use Compass to View Data**

- As your app runs and creates data (users, sermons, etc.), you can view and manage it in MongoDB Compass.

---

### **Summary Table**

| Step | Action | Result |
|------|--------|--------|
| 1    | Install & start MongoDB | MongoDB service running |
| 2    | Connect with Compass | See local server |
| 3    | Verify/create DB | Ready for app data |
| 4    | Check `.env` | Correct URI set |
| 5    | Start backend | App connects to DB |
| 6    | Test | No errors = success |
| 7    | Use Compass | View/manage data |

---

**If you hit any errors or need screenshots for a step, let me know!** 

Great news! Your MongoDB server is running and your `quezon_central_church` database is set up with all the expected collections (contacts, donations, events, musicmedias, sabbathschools, sermons, sessions, users). This means your backend is successfully connecting to MongoDB and your data structure is ready.

---

## **What to Do Next**

### 1. **Test the Login Route with POST (not GET)**
- Remember, `/api/auth/login` only works with a **POST** request, not by visiting the URL in your browser.
- Use **Postman** or **curl** to send a POST request.

#### **Example with curl:**
```sh
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@quezoncentralchurch.com","password":"admin123"}'
```

#### **Example with Postman:**
- Method: **POST**
- URL: `http://localhost:3000/api/auth/login`
- Body: **raw**, **JSON**
  ```json
  {
    "username": "admin@quezoncentralchurch.com",
    "password": "admin123"
  }
  ```

---

### 2. **If Login Succeeds**
- You’ll get a JSON response with a `token`.
- Use this token to trigger the YouTube sync endpoints as described earlier.

---

### 3. **If Login Fails**
- Double-check your admin credentials.
- If you never ran the setup script, run:
  ```sh
  npm run setup
  ```
  This will create the default admin user.

---

### 4. **Continue with YouTube Sync**
- Once you have your token, use it to POST to:
  - `/api/sermons/fetch-youtube`
  - `/api/sabbath-school/fetch-youtube`
  - `/api/music-media/fetch-youtube`

---

**You’re very close! If you hit any errors with the login or next steps, just let me know what you see and I’ll help you fix it.** 