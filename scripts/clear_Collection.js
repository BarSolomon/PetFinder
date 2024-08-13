const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// MongoDB connection URI
const mongoURI = process.env.MONGO_URI;

// Collection name you want to clear
const collectionName = 'photos';

const clearCollection = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected');

        // Clear the specified collection
        await mongoose.connection.collection(collectionName).deleteMany({});
        console.log(`Collection '${collectionName}' cleared`);

        // Close the connection
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    } catch (error) {
        console.error('Error clearing collection:', error);
        process.exit(1);
    }
};

// Run the clearCollection function
clearCollection();
