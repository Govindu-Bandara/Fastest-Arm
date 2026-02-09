const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const speedRoutes = require('./routes/speeds');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Routes
app.use('/api/speeds', speedRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: 'Something went wrong!' });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');

    const PORT = process.env.PORT || 5000;

    // ✅ Updated: Bind to all interfaces (so it works on same Wi-Fi)
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on all interfaces: http://0.0.0.0:${PORT}`);
      console.log('💡 Use your local IP to access this from another device on the same Wi-Fi.');
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

module.exports = app;
