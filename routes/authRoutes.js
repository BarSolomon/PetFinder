// routes/authRoutes.js

const express = require('express');
const { registerUser, loginUser, updateUser, getUser } = require('../controllers/authController');

const router = express.Router();

// Registration route
router.post('/register', registerUser);

// Login route
router.post('/login', loginUser);

router.get('/user/:userId', getUser);

router.put('/update/:userId', updateUser);

module.exports = router;
