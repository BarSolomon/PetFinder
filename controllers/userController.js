const User = require('../models/users');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

// Initialize the Google OAuth2 client with your Google client ID
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Verifies the Google token and retrieves the user's Google profile
const verifyGoogleToken = async (token) => {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID, // Ensure this matches your Google client ID
    });
    return ticket.getPayload();
};

// Generates a session JWT
const generateSessionToken = (user) => {
    const payload = { id: user._id };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }); // Extended to 1 hour
};

// Generates a refresh JWT
const generateRefreshToken = (user) => {
    const payload = { id: user._id };
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

// Handles Google OAuth for mobile registration and login
const googleAuthMobile = async (req, res) => {
    const { idToken } = req.body;
    try {
        // Verify the ID token using the Google API
        const payload = await verifyGoogleToken(idToken);

        const { email, sub: googleId, given_name: firstName, family_name: lastName } = payload;

        // Find or create the user in the database
        let user = await User.findOne({ email });

        if (!user) {
            user = new User({
                googleId,
                email,
                firstName,
                lastName,
                phone: '', // Default phone to empty string
                city: '',  // Default city to empty string
                pets: []   // Initialize pets as an empty array
            });
            await user.save(); // Save the new user to the database
        }

        // Generate JWT tokens for the session
        const sessionToken = generateSessionToken(user);
        const refreshToken = generateRefreshToken(user);

        // Send the JWT tokens and user data back to the client
        res.json({ token: sessionToken, refreshToken, user });
    } catch (err) {
        console.error('Google mobile authentication error:', err);
        res.status(400).send('Invalid token');
    }
};

// Handles the Google OAuth callback for web-based registration/login
const googleAuthCallback = async (req, res) => {
    try {
        const user = req.user;

        const sessionToken = generateSessionToken(user);
        const refreshToken = generateRefreshToken(user);

        res.json({ token: sessionToken, refreshToken, user });
    } catch (err) {
        console.error('Google OAuth callback error:', err);
        res.status(500).send('Authentication failed');
    }
};

// Refreshes the access token using the refresh token
const refreshAccessToken = (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(403).json({ message: 'Refresh token is required' });

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid refresh token' });

        const newToken = generateSessionToken(user);
        const newRefreshToken = generateRefreshToken(user);
        res.json({ token: newToken, refreshToken: newRefreshToken });
    });
};

// Updates the user's phone number
const updateUserPhone = async (req, res) => {
    const { email, phone } = req.body;
    try {
        const user = await User.findOneAndUpdate({ email }, { phone }, { new: true });
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.send(user);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};

// Updates the user's city
const updateUserCity = async (req, res) => {
    const { email, city } = req.body;
    try {
        const user = await User.findOneAndUpdate({ email }, { city }, { new: true });
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.send(user);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};

// Retrieves the current authenticated user
const getCurrentUser = (req, res) => {
    res.send(req.user);
};

// Handles user logout
const logout = (req, res) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
};

module.exports = {
    googleAuthMobile,
    googleAuthCallback,
    refreshAccessToken,
    updateUserPhone,
    updateUserCity,
    getCurrentUser,
    logout
};
