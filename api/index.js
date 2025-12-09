const express = require('express');
const cors = require('cors');
const path = require('path');

// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
}

const app = express();

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes - use path.join for proper resolution
const leadsRoutes = require(path.join(__dirname, '..', 'server', 'routes', 'leads'));
const adminRoutes = require(path.join(__dirname, '..', 'server', 'routes', 'admin'));

// API Routes
app.use('/api/leads', leadsRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }
  });
});

// Root API endpoint
app.get('/api', (req, res) => {
  res.json({ message: 'Coupang Eats Admin API', version: '1.0.0' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: '서버 오류가 발생했습니다.', details: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

// Export for Vercel serverless
module.exports = app;
