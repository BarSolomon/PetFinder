require('dotenv').config(); // Load environment variables

const mongoose = require('mongoose');
const Pet = require('../models/pets'); // Adjust the path to your Pet model
const mongoURI = process.env.MONGO_URI;

async function updateAllPetsWithIsPetMine() {
    try {
        //const mongo_URL = process.env.MONGO_URI;

        // Connect to MongoDB (use your MongoDB connection string)
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        const result = await Pet.updateMany(
            { isPetMine: { $exists: false } }, // Only update documents that don't already have the field
            { $set: { isPetMine: true } } // Set isPetMine to true
        );

        console.log(`Updated ${result.modifiedCount} pet documents to include the isPetMine field.`);

        // Close the connection
        await mongoose.connection.close();
    } catch (error) {
        console.error('Error updating pet documents:', error);
    }
}

updateAllPetsWithIsPetMine();
