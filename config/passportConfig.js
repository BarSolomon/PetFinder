const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
console.log(GoogleStrategy);

const User = require('../models/users'); // Adjust the path if necessary
const jwt = require('jsonwebtoken');  // Import jsonwebtoken for JWT creation

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: 'http://localhost:8080/api/users/auth/google',  // Updated port to 8080
    scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('OAuth Success:', profile);
        const email = profile.emails[0].value;
        const firstName = profile.name.givenName;
        const lastName = profile.name.familyName;

        // Check if the user already exists in the database
        let user = await User.findOne({ email });

        if (!user) {
            // If the user does not exist, create a new user
            user = new User({
                googleId: profile.id,
                email,
                firstName,
                lastName
            });
            await user.save();
        }

        // Generate a JWT for the authenticated user
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Return the user object and the JWT
        return done(null, { user, token });
    } catch (err) {
        console.error('Error during Google OAuth:', err);
        return done(err, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.user.id);  // Serialize the user ID for session management
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

module.exports = passport;
