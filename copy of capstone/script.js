// Mobile menu functionality
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

mobileMenuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    const spans = mobileMenuBtn.querySelectorAll('span');
    spans[0].classList.toggle('rotate-45');
    spans[1].classList.toggle('opacity-0');
    spans[2].classList.toggle('-rotate-45');
});

// Close mobile menu when clicking a link
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
    });
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Update copyright year
document.getElementById('year').textContent = new Date().getFullYear();

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Add fade-in animation to sections
document.querySelectorAll('section').forEach(section => {
    section.classList.add('fade-out');
    observer.observe(section);
});

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    .fade-out {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.6s ease-out, transform 0.6s ease-out;
    }
    .fade-in {
        opacity: 1;
        transform: translateY(0);
    }
    .mobile-menu-btn span {
        transition: all 0.3s ease-in-out;
    }
    .mobile-menu-btn span.rotate-45 {
        transform: rotate(45deg) translate(5px, 5px);
    }
    .mobile-menu-btn span.opacity-0 {
        opacity: 0;
    }
    .mobile-menu-btn span.-rotate-45 {
        transform: rotate(-45deg) translate(5px, -5px);
    }
`;
document.head.appendChild(style);

// Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-church-website.firebaseapp.com",
  projectId: "your-church-website",
  storageBucket: "your-church-website.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();


// Admin Dashboard Functionality

// Authentication State Observer
auth.onAuthStateChanged((user) => {
  if (user) {
      document.getElementById('currentUser').textContent = user.email;
      loadDashboardStats();
  } else {
      window.location.href = 'index.html';
  }
});

// Logout Functionality
document.getElementById('logoutBtn').addEventListener('click', () => {
  auth.signOut();
});

// Panel Navigation
document.querySelectorAll('.menu-btn').forEach(button => {
  button.addEventListener('click', () => {
      // Update active button
      document.querySelector('.menu-btn.active').classList.remove('active');
      button.classList.add('active');
      
      // Show corresponding panel
      const targetPanel = button.dataset.panel;
      document.querySelector('.panel.active').classList.remove('active');
      document.getElementById(`${targetPanel}-panel`).classList.add('active');
      
      // Load panel data
      loadPanelData(targetPanel);
  });
});

// Dashboard Statistics
async function loadDashboardStats() {
  try {
      const usersSnapshot = await db.collection('users').get();
      const eventsSnapshot = await db.collection('events').where('date', '>=', new Date()).get();
      const chatsSnapshot = await db.collection('chatRooms').where('active', '==', true).get();

      document.getElementById('totalUsers').textContent = usersSnapshot.size;
      document.getElementById('upcomingEvents').textContent = eventsSnapshot.size;
      document.getElementById('activeChats').textContent = chatsSnapshot.size;
  } catch (error) {
      console.error('Error loading dashboard stats:', error);
  }
}

// Livestream Management
const streamControls = {
  start: document.getElementById('startStream'),
  end: document.getElementById('endStream'),
  title: document.getElementById('streamTitle'),
  key: document.getElementById('streamKey')
};

streamControls.start.addEventListener('click', async () => {
  try {
      await db.collection('livestreams').add({
          title: streamControls.title.value,
          key: streamControls.key.value,
          startTime: new Date(),
          active: true
      });
      alert('Stream started successfully!');
  } catch (error) {
      console.error('Error starting stream:', error);
      alert('Failed to start stream');
  }
});

// Event Management
async function loadEvents() {
  const tbody = document.getElementById('eventsTableBody');
  tbody.innerHTML = '';
  
  try {
      const snapshot = await db.collection('events').orderBy('date').get();
      snapshot.forEach(doc => {
          const event = doc.data();
          const row = document.createElement('tr');
          row.innerHTML = `
              <td>${event.name}</td>
              <td>${event.date.toDate().toLocaleDateString()}</td>
              <td>${event.time}</td>
              <td>${event.location}</td>
              <td>
                  <button onclick="editEvent('${doc.id}')" class="btn-edit">Edit</button>
                  <button onclick="deleteEvent('${doc.id}')" class="btn-delete">Delete</button>
              </td>
          `;
          tbody.appendChild(row);
      });
  } catch (error) {
      console.error('Error loading events:', error);
  }
}

// User Management
async function loadUsers() {
  const tbody = document.getElementById('usersTableBody');
  tbody.innerHTML = '';
  
  try {
      const snapshot = await db.collection('users').get();
      snapshot.forEach(doc => {
          const user = doc.data();
          const row = document.createElement('tr');
          row.innerHTML = `
              <td>${user.name}</td>
              <td>${user.email}</td>
              <td>${user.role}</td>
              <td>${user.status}</td>
              <td>
                  <button onclick="editUser('${doc.id}')" class="btn-edit">Edit</button>
                  <button onclick="deleteUser('${doc.id}')" class="btn-delete">Delete</button>
              </td>
          `;
          tbody.appendChild(row);
      });
  } catch (error) {
      console.error('Error loading users:', error);
  }
}

// Chat System
let currentChatRoom = null;

async function loadChatRooms() {
  const roomsList = document.getElementById('chatRoomsList');
  roomsList.innerHTML = '';
  
  try {
      const snapshot = await db.collection('chatRooms').get();
      snapshot.forEach(doc => {
          const room = doc.data();
          const li = document.createElement('li');
          li.textContent = room.name;
          li.onclick = () => loadChatMessages(doc.id);
          roomsList.appendChild(li);
      });
  } catch (error) {
      console.error('Error loading chat rooms:', error);
  }
}

async function loadChatMessages(roomId) {
  currentChatRoom = roomId;
  const messagesList = document.getElementById('messagesList');
  messagesList.innerHTML = '';
  
  try {
      const snapshot = await db.collection(`chatRooms/${roomId}/messages`)
          .orderBy('timestamp')
          .limit(50)
          .get();
          
      snapshot.forEach(doc => {
          const message = doc.data();
          const div = document.createElement('div');
          div.className = 'message';
          div.innerHTML = `
              <span class="message-user">${message.user}:</span>
              <span class="message-text">${message.text}</span>
              <span class="message-time">${message.timestamp.toDate().toLocaleTimeString()}</span>
          `;
          messagesList.appendChild(div);
      });
      
      messagesList.scrollTop = messagesList.scrollHeight;
  } catch (error) {
      console.error('Error loading messages:', error);
  }
}

// Content Management
async function loadContent() {
  const contentList = document.querySelector('.content-list');
  contentList.innerHTML = '';
  
  try {
      const snapshot = await db.collection('content').get();
      snapshot.forEach(doc => {
          const content = doc.data();
          const div = document.createElement('div');
          div.className = 'content-item';
          div.innerHTML = `
              <h3>${content.title}</h3>
              <p>${content.type} - Last updated: ${content.lastUpdated.toDate().toLocaleDateString()}</p>
              <div class="content-actions">
                  <button onclick="editContent('${doc.id}')" class="btn-edit">Edit</button>
                  <button onclick="deleteContent('${doc.id}')" class="btn-delete">Delete</button>
              </div>
          `;
          contentList.appendChild(div);
      });
  } catch (error) {
      console.error('Error loading content:', error);
  }
}

// Panel Data Loading
function loadPanelData(panel) {
  switch(panel) {
      case 'dashboard':
          loadDashboardStats();
          break;
      case 'events':
          loadEvents();
          break;
      case 'users':
          loadUsers();
          break;
      case 'chat':
          loadChatRooms();
          break;
      case 'content':
          loadContent();
          break;
  }
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
  // Check authentication state
  auth.onAuthStateChanged((user) => {
      if (!user) {
          window.location.href = 'index.html';
      }
  });
  
  // Load dashboard data
  loadDashboardStats();
});

// Modal Functionality
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modalContent');
const closeModal = document.querySelector('.close');

closeModal.onclick = () => modal.style.display = 'none';
window.onclick = (event) => {
  if (event.target === modal) {
      modal.style.display = 'none';
  }
};



// Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-church-website.firebaseapp.com",
  projectId: "your-church-website",
  storageBucket: "your-church-website.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

export { app, auth, db, storage };


import { auth, db, storage } from './config.js';

// Admin Dashboard Functionality
// ... existing code ...