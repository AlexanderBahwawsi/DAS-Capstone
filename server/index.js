require('dotenv').config();
const http = require('http');

const app = require('./app');
const { initializeDatabase } = require('./config/db');
const { setupSocket } = require('./socket');

const PORT = process.env.PORT || 3001;

const httpServer = http.createServer(app);
const io = setupSocket(httpServer);
app.set('io', io);

initializeDatabase()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`KCR server running at http://localhost:${PORT}`);
      console.log(`Socket.IO ready for real-time messages`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err.message);
    process.exit(1);
  });
