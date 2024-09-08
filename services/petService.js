const mongoose = require('mongoose');
const Pet = require('../models/pets');
const PossibleMatch = require('../models/possibleMatch'); // Adjust the path if necessary



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

        // Ensure the pet has a valid location
        if (!pet.location || !pet.location.coordinates) {
            return { message: 'The pet does not have a valid location.' };
        }

        // Extract the coordinates
        const coordinates = pet.location.coordinates; // [longitude, latitude]

        // Extract the breed from the pet
        const petBreed = pet.breed;

        // Convert the pet's breed predictions to a Set for efficient lookup
        const petBreedsSet = new Set(
            pet.breeds_predictions ? pet.breeds_predictions.predictions.map(prediction => prediction.breed) : []
        );

        console.log(`Pet ID ${petId} has ${petBreedsSet.size} breed predictions.`);

        // MongoDB Aggregation Pipeline
        const pipeline = [
            {
                $geoNear: {
                    near: { type: 'Point', coordinates: coordinates },
                    distanceField: 'distance',
                    maxDistance: 50000,  // 50 km in meters
                    spherical: true,
                    query: {
                        _id: { $ne: new mongoose.Types.ObjectId(petId) }, // Exclude the pet itself
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
                    hasMatchingBreed: {
                        $cond: {
                            if: { $eq: ['$breed', petBreed] }, // Check if the pet's breed matches the input pet's breed
                            then: true,
                            else: {
                                $in: [petBreed, '$breeds_predictions.predictions.breed'] // Check if any prediction matches the input pet's breed
                            }
                        }
                    }
                }
            },
            {
                $match: {
                    hasMatchingBreed: true // Only keep pets with at least one matching breed
                }
            },
            {
                $project: {
                    name: 1,
                    breed: 1,
                    distance: 1,
                    breeds_predictions: 1,
                    location: 1, // Include location details for completeness
                    owner: 1 // Include owner details for completeness
                }
            }
        ];

        // Execute the aggregation pipeline with logging after each stage
        console.log('Running geoNear to find nearby pets...');
        let result = await Pet.aggregate([pipeline[0]]);
        console.log(`Found ${result.length} pets within 50 km of the coordinates.`);

        console.log('Looking up breed predictions for the nearby pets...');
        result = await Pet.aggregate([pipeline[0], pipeline[1]]);
        console.log(`Breed predictions lookup completed for ${result.length} pets.`);

        console.log('Unwinding breed predictions...');
        result = await Pet.aggregate([pipeline[0], pipeline[1], pipeline[2]]);
        console.log(`Unwound breed predictions for ${result.length} pets.`);

        console.log('Checking for matching breeds...');
        result = await Pet.aggregate([pipeline[0], pipeline[1], pipeline[2], pipeline[3]]);
        console.log(`Filtered to ${result.length} pets with at least one matching breed.`);

        console.log('Projecting final fields...');
        result = await Pet.aggregate([pipeline[0], pipeline[1], pipeline[2], pipeline[3], pipeline[4]]);
        console.log(`Projection complete. Final number of matching pets: ${result.length}.`);

        return result;

    } catch (error) {
        console.error('Error finding matching lost pets:', error);
        throw error;
    }
}







/**
 * Function to store possible matches for a given pet
 * @param {String} petId - The ID of the pet for which to store matches
 * @param {Array} matchedPetIds - An array of pet IDs that are considered matches
 * @returns {Object} - Returns the stored possible match document
 */
async function storePetMatches(petId, matchedPetIds) {
    try {
        // Convert petId to ObjectId if it's a string
        const objectId = new mongoose.Types.ObjectId(petId);

        // Check if a PossibleMatch document already exists for the given petId
        let possibleMatch = await PossibleMatch.findOne({ petId: objectId });

        if (possibleMatch) {
            // If it exists, update the matches array
            possibleMatch.matches = matchedPetIds;
        } else {
            // If it does not exist, create a new PossibleMatch document
            possibleMatch = new PossibleMatch({
                petId: objectId,
                matches: matchedPetIds
            });
        }

        // Save the document to the database
        const savedMatch = await possibleMatch.save(); // Correct instance is being saved here
        console.log(`Stored possible matches for pet ID ${petId}:`, matchedPetIds);

        return savedMatch;
    } catch (error) {
        console.error('Error storing possible pet matches:', error);
        throw error;
    }
}

module.exports = {
    findMatchingLostPets, findNearbyPets, storePetMatches
};

