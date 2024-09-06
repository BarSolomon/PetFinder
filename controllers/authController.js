// controllers/authController.js

const User = require('../models/users');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit'); // For rate limiting
const validator = require('validator'); // For email validation

// Rate Limiter to prevent abuse on registration endpoint
const registrationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 registration requests per windowMs
    message: "Too many registration attempts from this IP, please try again after 15 minutes."
});

// Rate Limiter to prevent abuse on login endpoint
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login requests per windowMs
    message: "Too many login attempts from this IP, please try again after 15 minutes."
});
exports.registerUser = [registrationLimiter, async (req, res) => {
    const { email, firstName, lastName, password, city } = req.body;

    // Trim and sanitize inputs
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    // Validate inputs
    if (!trimmedEmail || !firstName || !lastName || !trimmedPassword || !city) {
        return res.status(400).json({ message: 'All fields (email, firstName, lastName, password, city) are required.' });
    }

    // Validate email format
    if (!validator.isEmail(trimmedEmail)) {
        return res.status(400).json({ message: 'Invalid email format.' });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(trimmedPassword)) {
        return res.status(400).json({
            message: 'Password must be at least 8 characters long, include at least one uppercase letter, one lowercase letter, one number, and one special character.'
        });
    }

    try {
        // Ensure uniqueness by checking if the user already exists
        const existingUser = await User.findOne({ email: trimmedEmail });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists.' });
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(trimmedPassword, 10);
        console.log("Hashed Password on Registration:", hashedPassword);

        // Create a new user instance
        const newUser = new User({
            email: trimmedEmail,
            firstName,
            lastName,
            password: hashedPassword,
            city
        });

        // Save the user to the database
        await newUser.save();

        res.status(201).json({
            userId: newUser._id,
            message: 'User registered successfully.',
            userInfo: {
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                city: newUser.city
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
}];


exports.loginUser = [loginLimiter, async (req, res) => {
    const { email, password } = req.body;

    // Trim and sanitize inputs
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    // Validate inputs
    if (!trimmedEmail || !trimmedPassword) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        // Find the user by email
        const user = await User.findOne({ email: trimmedEmail });
        console.log("Retrieved User:", user);  // Log user for debugging

        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password.' });
        }

        // Compare password using bcrypt
        const isMatch = await bcrypt.compare(trimmedPassword, user.password);
        console.log("Comparing passwords:", trimmedPassword, user.password);  // Log passwords
        console.log("Password Comparison Result:", isMatch);  // Log comparison result

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password.' });
        }

        res.status(200).json({
            userId: user._id,
            message: 'User logged in successfully.',
            userInfo: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                city: user.city
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
}];
// controllers/userController.js

exports.getUser = async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findById(userId).select('-password -pets'); // Exclude 'password' and 'pets'

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({
            message: 'User retrieved successfully.',
            userInfo: {
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                city: user.city
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error during fetching user data.' });
    }
};


exports.updateUser = async (req, res) => {
    const { userId } = req.params;
    const { email, firstName, lastName, password, phone, city } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Update fields only if they are provided in the request
        if (email) {
            if (!validator.isEmail(email)) {
                return res.status(400).json({ message: 'Invalid email format.' });
            }
            user.email = email;
        }
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (password) {
            // Hash the new password
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
        }
        if (phone !== undefined) user.phone = phone;
        if (city) user.city = city;

        await user.save();

        res.status(200).json({
            message: 'User updated successfully.',
            userInfo: {
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                city: user.city
            }
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Server error during user update.' });
    }
};