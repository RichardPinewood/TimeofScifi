require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');


// Import all routes from userRoutes
const routes = require('./routes/userRoutes');

const app = express();



// Simple CORS setup for local development
app.use(cors());

// Enable pre-flight requests for all routes
app.options('*', cors());
app.use(express.json());


const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI is missing in .env file!');
  process.exit(1);
}


if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'your_fallback_secret_please_change_in_production';
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));


app.use(express.static(path.join(__dirname, '../TImeofSciFi')));

app.use('/auth', routes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../TimeofScifi/home.html'));
});

app.get('/perfil.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../TimeofScifi/perfil.html'));
});

app.get('/recommend.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../TimeofScifi/recommend.html'));
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
