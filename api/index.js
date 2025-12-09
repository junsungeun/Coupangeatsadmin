const express = require('express');
const cors = require('cors');

const app = express();

// CORS - allow all origins
app.use(cors());
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const leadsRoutes = require('../server/routes/leads');
const adminRoutes = require('../server/routes/admin');

// API Routes
app.use('/api/leads', leadsRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root API
app.get('/api', (req, res) => {
  res.json({ message: 'Coupang Eats Admin API' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

module.exports = app;
