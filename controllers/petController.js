const Pet = require('../models/pets');
const User = require('../models/users');
const { classifyAndStoreBreeds } = require('../services/aiService');
const mongoose = require("mongoose");

const createPet = async (req, res) => {
    try {
        const { name, age, breed, type, gender, description, city, ownerEmail } = req.body;

        const owner = await User.findOne({ email: ownerEmail });
        if (!owner) {
            return res.status(404).json({ error: 'Owner not found' });
        }

        const pet = new Pet({
            name,
            age,
            breed,
            type,
            gender,
            description,
            city,
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
        const { petId } = req.params;
        const updateData = req.body;

        const pet = await Pet.findByIdAndUpdate(petId, updateData, { new: true });

        if (!pet) {
            return res.status(404).json({ error: 'Pet not found' });
        }

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

        // Delete the pet document from MongoDB
        try {
            await Pet.deleteOne({ _id: petId });
        } catch (err) {
            console.error(`Failed to delete pet document from MongoDB: ${err}`);
        }

        res.status(200).json({ message: 'Pet and all associated photos deleted successfully' });
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

module.exports = {
    createPet,
    updatePet,
    deletePet,
    getLostPets,
    updateLostStatus,
    getPetsByUserId,
    classifyPetBreeds,
    getPetData
};
