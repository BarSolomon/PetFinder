const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/config');
const passport = require('./config/passportConfig');
const { initGridFS } = require('./config/gridfs');
const photoRoutes = require('./routes/photoRoutes');
const petRoutes = require('./routes/petRoutes');
const userRoutes = require('./routes/userRoutes');

dotenv.config();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3000;

connectDB().then((db) => {
    initGridFS(db);
});

// Middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

require('./config/passportConfig');

// Route Middleware
app.use('/api/photos', photoRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/users', userRoutes);

// Base route
app.get('/', (req, res) => {
    res.send('starting the server');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
