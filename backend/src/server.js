require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB } = require('./config/db');
const { seedDatabase } = require('./seed/seedData');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'https://safe-route-ai-community-driven-safe.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api', apiRoutes);

// Root greeting
app.get('/', (req, res) => {
  res.json({
    name: 'SafeRoute API — Community Safety Mapping Engine',
    version: '1.0.0',
    documentation: '/api/health',
    endpoints: [
      'POST /api/routes/calculate',
      'GET /api/incidents',
      'POST /api/incidents',
      'GET /api/safety-points',
      'GET /api/analytics/area-score',
      'GET /api/analytics/overview'
    ]
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[Unhandled Error]`, err);
  res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});

// Start Server
async function startServer() {
  const isConnected = await connectDB();
  if (isConnected) {
    // Populate DB with initial seed data if empty
    await seedDatabase();
  }

  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 SafeRoute Server running on http://localhost:${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
    console.log(`======================================================\n`);
  });
}

startServer();
