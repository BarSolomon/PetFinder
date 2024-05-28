/*
מחלקה זו מכילה את התצורה של יישומון Passport לאימות משתמשים באמצעות Google OAuth 2.0.
Holds the configuration of the Passport application for user authentication using Google OAuth 2.0.
 */


const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/users');
const fs = require('fs');


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        //check if the user is already exist in the data base
        const email = profile.emails[0].value;
        const firstName = profile.name.givenName;
        const lastName = profile.name.familyName;
        let user = await User.findOne({ email });

        if (!user) {
            //if the user is not exist - create new user
            user = new User({
                googleId: profile.id,
                email,
                firstName,
                lastName
                // add more details..
            });
            await user.save();
        }

        // return the user
        return done(null, user);
    } catch (err) {
        console.error(err);
        return done(err, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
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