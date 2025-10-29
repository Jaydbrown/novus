const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const contactRoutes = require('./routes/contactRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const blogRoutes = require('./routes/blogRoutes');

const app = express();

// ✅ CORS configuration
const allowedOrigins = [
  'https://novus-frontend-ten.vercel.app', // production frontend (Vercel)
  'http://localhost:5173', // local dev frontend (Vite default)
  'http://localhost:3000', // optional for Create React App
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`❌ Blocked CORS request from origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ==================== Add this to your server.js or app.js ====================
// Place this code AFTER your database connection is established

const Admin = require('./models/Admin');

// Auto-create admin on startup
async function ensureAdminExists() {
  try {
    const username = 'jaiyeola';
    const email = 'jaiyeolawety705@gmail.com';
    const password = 'jaiyeolaeva';
    
    // Check if admin exists
    const existingAdmin = await Admin.findByUsername(username);
    
    if (!existingAdmin) {
      // Create admin if doesn't exist
      const admin = await Admin.create({ username, email, password });
      console.log('✅ Admin account created automatically');
      console.log(`   Username: ${admin.username}`);
      console.log(`   Email: ${admin.email}`);
    } else {
      console.log('✅ Admin account already exists');
    }
  } catch (error) {
    console.error('⚠️  Admin creation check failed:', error.message);
  }
}

// Call this function after database is connected
ensureAdminExists();

// Continue with your server startup code...
// app.listen() etc.

app.use(express.json());
app.use(express.static('public'));

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/blog', blogRoutes);

// ✅ Error handling middleware
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

