const User = require('../models/users');

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

const getCurrentUser = (req, res) => {
    res.send(req.user);
};

const googleAuthCallback = (req, res) => {
    res.redirect('/');
};

const logout = (req, res) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
};

module.exports = {
    updateUserPhone,
    updateUserCity,
    getCurrentUser,
    googleAuthCallback,
    logout
};
