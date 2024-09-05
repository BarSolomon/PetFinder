const Pet = require('../models/pets');
const User = require('../models/users');
const { classifyAndStoreBreeds } = require('../services/aiService');
const mongoose = require("mongoose");
const BreedPrediction = require('../models/BreedPrediction');
const Photo = require('../models/photo');
const GPTInteraction = require('../models/gptInteraction');
const { deleteFile } = require('../services/googleCloudStorage');
const { getCoordinates } = require('../services/geolocationService');



const createPet = async (req, res) => {
    try {
        const { name, age, breed, type, gender, description, city, fullAddress, ownerEmail } = req.body;

        const owner = await User.findOne({ email: ownerEmail });
        if (!owner) {
            return res.status(404).json({ error: 'Owner not found' });
        }

        // Fetch coordinates for the full address
        const coords = await getCoordinates(fullAddress);

        console.log('Fetched coordinates:', coords);

        // Ensure correct order: [longitude, latitude]
        const coordinates = coords && coords.longitude !== undefined && coords.latitude !== undefined
            ? [coords.longitude, coords.latitude] // Correct order
            : null;

        if (!coordinates) {
            return res.status(400).json({ error: 'Invalid address or unable to fetch coordinates.' });

        }

        const pet = new Pet({
            name,
            age,
            breed,
            type,
            gender,
            description,
            city,
            fullAddress,
            location: {  // Store as GeoJSON Point
                type: 'Point',
                coordinates
            },
            owner: owner._id
        });

        await pet.save();
        owner.pets.push(pet._id);
        await owner.save();

        res.status(201).json({ message: 'Pet created successfully', pet });
    } catch (error) {
        console.error('Create pet error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getPetData = async(req, res) =>{
    console.log(req.body);
    try {
        const {petId} = req.body
        const pet = await Pet.findPetByPetID(petId);
        if (!pet){
            return res.status(404).json({erorr: 'pet not found'})
    }
        res.status(200).json(pet);
    }catch (error) {
        console.error('Pet not found:', error);
        res.status(500).json({error: 'Internal server error'})
    }
};

const updatePet = async (req, res) => {
    try {
        const { petId } = req.params; // Extract pet ID from URL parameters
        const updateData = req.body;  // Extract fields to update from request body

        // Fetch the pet document by ID
        const pet = await Pet.findById(petId);

        if (!pet) {
            return res.status(404).json({ error: 'Pet not found' });
        }

        // Check if fullAddress is being updated and fetch new coordinates
        if (updateData.fullAddress) {
            const coords = await getCoordinates(updateData.fullAddress);

            console.log('Fetched coordinates for update:', coords);

            // Ensure correct order: [longitude, latitude]
            const coordinates = coords && coords.longitude !== undefined && coords.latitude !== undefined
                ? [coords.longitude, coords.latitude] // Correct order
                : null;

            if (!coordinates) {
                return res.status(400).json({ error: 'Invalid address or unable to fetch coordinates.' });
            }

            // Update the location field
            pet.location = {
                type: 'Point',
                coordinates
            };

            pet.fullAddress = updateData.fullAddress; // Update full address
        }

        // Update only the provided fields in updateData
        if (updateData.name) pet.name = updateData.name;
        if (updateData.age) pet.age = updateData.age;
        if (updateData.breed) pet.breed = updateData.breed;
        if (updateData.type) pet.type = updateData.type;
        if (updateData.gender) pet.gender = updateData.gender;
        if (updateData.description) pet.description = updateData.description;
        if (updateData.isLost !== undefined) pet.isLost = updateData.isLost;
        if (updateData.city) pet.city = updateData.city;
        if (updateData.owner) pet.owner = updateData.owner;

        // Save the updated pet document
        await pet.save();

        res.status(200).json({ message: 'Pet updated successfully', pet });
    } catch (error) {
        console.error('Update pet error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};




const deletePet = async (req, res) => {
    const { petId, ownerId } = req.body;

    try {
        const pet = await Pet.findOne({ _id: petId, owner: ownerId });
        if (!pet) {
            return res.status(404).json({ error: 'Pet not found or permission denied' });
        }

        // Iterate over the photos array in the pet document
        for (const photoId of pet.photos) {
            try {
                const photo = await Photo.findById(photoId);
                if (photo) {
                    try {
                        await deleteFile(photo.filename); // Delete from Google Cloud Storage
                    } catch (err) {
                        console.error(`Failed to delete photo from GCS: ${err}`);
                    }
                }
                try {
                    await Photo.deleteOne({ _id: photoId }); // Delete photo document from MongoDB
                } catch (err) {
                    console.error(`Failed to delete photo document from MongoDB: ${err}`);
                }
            } catch (err) {
                console.error(`Failed to find photo by ID: ${err}`);
            }
        }

        // Delete breed predictions if they exist
        if (pet.breeds_predictions) {
            try {
                await BreedPrediction.deleteOne({ _id: pet.breeds_predictions });
            } catch (err) {
                console.error(`Failed to delete breed predictions: ${err}`);
            }
        }

        // Delete LostAD if it exists
        if (pet.lostAd) {
            try {
                await GPTInteraction.deleteOne({ _id: pet.lostAd });
            } catch (err) {
                console.error(`Failed to delete LostAD: ${err}`);
            }
        }

        // Remove pet reference from user's pets array
        try {
            await User.updateOne({ _id: ownerId }, { $pull: { pets: petId } });
        } catch (err) {
            console.error(`Failed to remove pet reference from user: ${err}`);
        }

        // Delete the pet document from MongoDB
        try {
            await Pet.deleteOne({ _id: petId });
        } catch (err) {
            console.error(`Failed to delete pet document from MongoDB: ${err}`);
        }

        res.status(200).json({ message: 'Pet and all associated data deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};



const getLostPets = async (req, res) => {
    try {
        const lostPets = await Pet.findLostPets();
        res.status(200).json(lostPets);
    } catch (error) {
        console.error('Get lost pets error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updateLostStatus = async (req, res) => {
    try {
        const { petId } = req.params;
        const { isLost } = req.body;

        const result = await Pet.updateLostStatus(petId, isLost);

        if (!result.success) {
            return res.status(400).json({ error: result.message });
        }

        res.status(200).json({ message: result.message });
    } catch (error) {
        console.error('Update lost status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
const getPetsByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;
        const objectId = new mongoose.Types.ObjectId(userId); // שימוש ב-'new' ליצירת ObjectId
        const pets = await Pet.find({ owner: objectId });

        res.status(200).json(pets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const classifyPetBreeds = async (req, res) => {
    const { petId } = req.params;

    try {
        const breedPrediction = await classifyAndStoreBreeds(petId);
        res.status(200).json({
            message: 'Breed predictions stored successfully',
            breedPrediction
        });
    } catch (error) {
        console.error('Error classifying breeds:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const getBreedPrediction = async (req, res) => {
    const { petId, breedPredictionId } = req.query;

    try {
        let breedPrediction;

        if (breedPredictionId) {
            // If breedPredictionId is provided, fetch the breed prediction directly
            breedPrediction = await BreedPrediction.findById(breedPredictionId);
        } else if (petId) {
            // If petId is provided, fetch the pet and then retrieve the breed prediction using the reference
            const pet = await Pet.findById(petId).populate('breeds_predictions');
            breedPrediction = pet.breeds_predictions;
        }

        // If breed prediction is not found or the predictions array is null, classify and store breeds
        if (!breedPrediction || (breedPrediction && (!breedPrediction.predictions || breedPrediction.predictions.length === 0))) {
            console.log('Predictions not found or empty. Classifying and storing breeds...');

            // Call the classifyAndStoreBreeds function to get new predictions
            breedPrediction = await classifyAndStoreBreeds(petId);

            if (!breedPrediction) {
                return res.status(404).json({ error: 'Breed prediction could not be generated.' });
            }
        }

        res.status(200).json(breedPrediction);
    } catch (error) {
        console.error('Error retrieving breed prediction:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createPet,
    updatePet,
    deletePet,
    getLostPets,
    updateLostStatus,
    getPetsByUserId,
    classifyPetBreeds,
    getPetData,
    getBreedPrediction
};
