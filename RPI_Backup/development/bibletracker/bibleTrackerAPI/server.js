const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');

dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Error connecting to MongoDB:', err);
});

// Import routes
const progressRoutes = require('./routes/progressRoutes');
const highlightRoutes = require('./routes/highlightRoutes');
const noteRoutes = require('./routes/noteRoutes');
const bibleVerseRoutes = require('./routes/bibleVerseRoutes');

// Use routes
app.use('/api/progress', progressRoutes);
app.use('/api/highlights', highlightRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/bible', bibleVerseRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});