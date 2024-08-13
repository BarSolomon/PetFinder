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
const gptRoutes = require('./routes/gptRoutes');
const { OpenAI } = require('openai');
const { testGPTConnection } = require('./services/gptService');
const authRoutes = require('./routes/auth');





dotenv.config();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 8080;

connectDB().then((db) => {
    initGridFS(db);
    testGPTConnection();


});

// Middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false
}));

app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

require('./config/passportConfig');

// Route Middleware
app.use('/api/photos', photoRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/users', userRoutes);
app.use('/api/gpt', gptRoutes);
app.use('/api/auth', authRoutes);



// Base route
app.get('/', (req, res) => {
    res.send('You have registered successfully ');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
