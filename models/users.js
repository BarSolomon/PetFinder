/*
מחלקה זו מייצגת משתמש במערכת.
 היא מאפשרת יצירה, עדכון ומחיקה של פרטי משתמש, כולל ניהול הרשאות וסיסמה.
Represents a user in the system.
It allows for creating, updating, and deleting user details,
including managing permissions and passwords.
 */


const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    googleId: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        default: '',
        required: false
    },
    city: {
        type: String,
        default: '',
        required: false
    },
    pets: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet'
    }]
});

module.exports = mongoose.model('User', UserSchema);
