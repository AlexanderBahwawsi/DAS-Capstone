require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// ---------- Middleware ----------
app.use(cors());
app.use(express.json());

// Serve frontend files
app.use('/css', express.static(path.join(__dirname, '..', 'css')));
app.use('/js',  express.static(path.join(__dirname, '..', 'js')));
app.use('/',    express.static(path.join(__dirname, '..', 'html')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ---------- API Routes ----------
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/submissions', require('./routes/submissions'));
app.use('/api/reviews',     require('./routes/reviews'));
app.use('/api/messages',    require('./routes/messages'));
app.use('/api/admin',       require('./routes/admin'));

// ---------- Error Handler ----------
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

// ---------- Start ----------
const { initializeDatabase } = require('./config/db');

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`KCR server running at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err.message);
    process.exit(1);
  });
