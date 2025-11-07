const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initClient, closeClient } = require('./config/xrpl');
const vaultRoutes = require('./routes/vaults');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/vaults', vaultRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// Initialiser et démarrer le serveur
const startServer = async () => {
  try {
    // Initialiser la connexion XRPL
    await initClient();
    
    // Démarrer le serveur Express
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║  🏦 XRPL BONDS MARKETPLACE - BACKEND   ║
║  Running on http://localhost:${PORT}       ║
║  Ready to accept contributions!        ║
╚════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await closeClient();
  process.exit(0);
});

startServer();

module.exports = app;
