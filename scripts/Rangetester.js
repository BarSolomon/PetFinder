const mongoose = require('mongoose');
const Pet = require('../models/pets'); // Adjust the path to your Pet model
const dotenv = require('dotenv');


async function findNearbyPets(petId) {
    try {
        // Connect to MongoDB
        await mongoose.connect(, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        // Fetch the pet details to get the location
        const pet = await Pet.findById(petId);
        if (!pet) {
            console.log('Pet not found.');
            return;
        }

        if (!pet.location || !pet.location.coordinates) {
            console.log('Pet does not have location coordinates.');
            return;
        }

        // Perform a geospatial query to find nearby pets within 50km
        const nearbyPets = await Pet.aggregate([
            {
                $geoNear: {
                    near: {
                        type: 'Point',
                        coordinates: pet.location.coordinates // [longitude, latitude]
                    },
                    distanceField: 'distance',
                    maxDistance: 50000, // 50km radius
                    spherical: true
                }
            },
            {
                $match: {
                    _id: { $ne: new mongoose.Types.ObjectId(petId) }, // Exclude the input pet itself
                    isLost: true // Only lost pets
                }
            }
        ]);

        console.log(`Found ${nearbyPets.length} nearby pets within 50km:`);
        console.log(nearbyPets);

        // Close the connection
        await mongoose.connection.close();
    } catch (error) {
        console.error('Error finding nearby pets:', error);
    }
}

// Replace 'YOUR_PET_ID_HERE' with the actual pet ID you want to test with
const petId = '66ddefdc080f5f1447eed144';
findNearbyPets(petId);
