const mongoose = require('mongoose');
const Pet = require('../models/pets');

/**
 * Find nearby pets based on the given pet's location and optional filters.
 *
 * @param {Object} filters - Optional filters (e.g., breed, age).
 * @param {String} petId - The ID of the reference pet.
 * @returns {Array} - List of nearby pets matching the criteria.
 */
async function findNearbyPets(filters = {}, petId) {
    try {
        const pet = await Pet.findById(petId);
        if (!pet || !pet.location || !pet.location.coordinates) {
            throw new Error('Pet not found or does not have a valid location.');
        }

        const { coordinates } = pet.location;
        const query = {
            location: {
                $near: {
                    $geometry: { type: "Point", coordinates },
                    $maxDistance: 50 * 1000  // 50 kilometers converted to meters
                }
            },
            ...filters // Apply any additional filters passed to the function
        };

        const nearbyPets = await Pet.find(query);
        return nearbyPets;
    } catch (error) {
        console.error('Error finding nearby pets:', error);
        throw error;
    }
}

async function findMatchingLostPets(petId, filters = {}) {
    try {
        // Fetch the pet by petId and populate its breed predictions
        const pet = await Pet.findById(petId).populate('breeds_predictions');
        if (!pet) {
            throw new Error('Pet not found');
        }

        // Ensure the pet is marked as lost
        if (!pet.isLost) {
            return { message: 'The pet is not marked as lost.' };
        }

        // Ensure the pet has a valid location
        if (!pet.location || !pet.location.coordinates) {
            return { message: 'The pet does not have a valid location.' };
        }

        // Extract the coordinates
        const coordinates = pet.location.coordinates; // [longitude, latitude]

        // Convert the pet's breed predictions to a Set for efficient lookup
        const petBreedsSet = new Set(pet.breeds_predictions ? pet.breeds_predictions.predictions.map(prediction => prediction.breed) : []);

        // MongoDB Aggregation Pipeline
        const pipeline = [
            {
                $geoNear: {
                    near: { type: 'Point', coordinates: coordinates },
                    distanceField: 'distance',
                    maxDistance: 50 * 1000,  // 50 km in meters
                    spherical: true,
                    query: {
                        _id: { $ne: mongoose.Types.ObjectId(petId) }, // Exclude the pet itself
                        isLost: true,  // Only lost pets
                        ...filters    // Apply any additional filters
                    }
                }
            },
            {
                $lookup: {
                    from: 'breedpredictions', // Collection name for breed predictions
                    localField: 'breeds_predictions',
                    foreignField: '_id',
                    as: 'breeds_predictions'
                }
            },
            {
                $unwind: {
                    path: '$breeds_predictions',
                    preserveNullAndEmptyArrays: true // Preserve documents without breed predictions
                }
            },
            {
                $addFields: {
                    commonBreeds: {
                        $filter: {
                            input: '$breeds_predictions.predictions',
                            as: 'prediction',
                            cond: { $in: ['$$prediction.breed', Array.from(petBreedsSet)] }
                        }
                    }
                }
            },
            {
                $match: {
                    commonBreeds: { $ne: [] } // Only keep pets with common breeds
                }
            },
            {
                $project: {
                    name: 1,
                    breed: 1,
                    distance: 1,
                    commonBreeds: 1,
                    breeds_predictions: 1
                }
            }
        ];

        // Execute the aggregation pipeline
        const matchingLostPets = await Pet.aggregate(pipeline);

        return matchingLostPets;

    } catch (error) {
        console.error('Error finding matching lost pets:', error);
        throw error;
    }
}

module.exports = {
    findMatchingLostPets, findNearbyPets
};

