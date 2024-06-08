const express = require('express');
const passport = require('passport');
const { updateUserPhone, updateUserCity, getCurrentUser, googleAuthCallback, logout } = require('../controllers/userController');
const router = express.Router();

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), googleAuthCallback);
router.get('/current_user', getCurrentUser);
router.get('/logout', logout);
router.post('/update_phone', updateUserPhone);
router.post('/update_city', updateUserCity);

module.exports = router;
