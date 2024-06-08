const Pet = require('../models/pets');
const User = require('../models/users');

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
    try {
        const { petId, ownerId } = req.body;

        const result = await Pet.deletePet(petId, ownerId);

        if (!result.success) {
            return res.status(400).json({ error: result.message });
        }

        res.status(200).json({ message: result.message });
    } catch (error) {
        console.error('Delete pet error:', error);
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

module.exports = {
    createPet,
    updatePet,
    deletePet,
    getLostPets,
    updateLostStatus
};
