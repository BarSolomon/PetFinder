const User = require('../models/users');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const client = new OAuth2Client(process.env.CLIENT_ID);

// Verifies the Google token and retrieves the user's Google profile
const verifyGoogleToken = async (token) => {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.CLIENT_ID,
    });
    return ticket.getPayload();
};

// Generates a session JWT
const generateSessionToken = (user) => {
    const payload = { id: user.id };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
};

// Generates a refresh JWT
const generateRefreshToken = (user) => {
    const payload = { id: user.id };
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

// Handles Google OAuth for mobile registration and login
const googleAuthMobile = async (req, res) => {
    const { idToken } = req.body;
    try {
        const payload = await verifyGoogleToken(idToken);
        const email = payload.email;
        const firstName = payload.given_name;
        const lastName = payload.family_name;

        let user = await User.findOne({ email });

        if (!user) {
            user = new User({
                googleId: payload.sub,
                email,
                firstName,
                lastName
            });
            await user.save();
        }

        const sessionToken = generateSessionToken(user);
        const refreshToken = generateRefreshToken(user);

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
