const express = require('express');
const passport = require('passport');
const {
    googleAuthCallback,
    googleAuthMobile,
    updateUserPhone,
    updateUserCity,
    getCurrentUser,
    logout
} = require('../controllers/userController');
const router = express.Router();

// Route to initiate Google OAuth for mobile (though typically mobile will use the mobile endpoint)
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth callback route (typically used after Google OAuth flow)
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), googleAuthCallback);

// Endpoint for mobile authentication (where the mobile app sends the Google ID token)
router.post('/auth/google/mobile', googleAuthMobile);
router.get('/auth/google/mobile', googleAuthMobile);


// Endpoint for updating the user's phone number
router.post('/update_phone', updateUserPhone);

// Endpoint for updating the user's city
router.post('/update_city', updateUserCity);

// Endpoint to get the current authenticated user
router.get('/current_user', getCurrentUser);

// Endpoint to log out the user
router.get('/logout', logout);

module.exports = router;
