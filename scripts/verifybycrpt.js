const bcrypt = require('bcrypt');

const plainTextPassword = 'Password123!';
const storedHashedPassword = '$2a$10$NWcFPtxphalV4l7L6.NIfeN4MCEa49CAOZAUoTz.Erh/FwYPrZDvC'; // Use the hash from your retrieved user

// Hash a new password for verification
bcrypt.hash(plainTextPassword, 10)
    .then(newHashedPassword => {
        console.log("New Hashed Password:", newHashedPassword);
        return bcrypt.compare(plainTextPassword, newHashedPassword);
    })
    .then(isMatch => {
        console.log("New Password Comparison Result:", isMatch); // Should be true
    })
    .catch(error => console.error("Error hashing password:", error));

// Compare existing stored password
bcrypt.compare(plainTextPassword, storedHashedPassword)
    .then(isMatch => {
        console.log("Stored Password Comparison Result:", isMatch); // Should be true
    })
    .catch(error => console.error("Error comparing passwords:", error));
