const express = require('express');
const cors = require('cors');

const app = express();

// CORS - allow all origins
app.use(cors());
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check - BEFORE routes to check env vars
app.get('/api/health', (req, res) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      SUPABASE_URL: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NOT SET',
      SUPABASE_SERVICE_ROLE_KEY: supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'not set'
    }
  });
});

// Import routes
let leadsRoutes, adminRoutes;
try {
  leadsRoutes = require('../server/routes/leads');
  adminRoutes = require('../server/routes/admin');
} catch (err) {
  console.error('Route import error:', err);
}

// API Routes
if (leadsRoutes) app.use('/api/leads', leadsRoutes);
if (adminRoutes) app.use('/api/admin', adminRoutes);

// Root API
app.get('/api', (req, res) => {
  res.json({ message: 'Coupang Eats Admin API', routes: { leads: !!leadsRoutes, admin: !!adminRoutes } });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = app;
