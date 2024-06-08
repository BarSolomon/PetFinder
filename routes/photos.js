/*const express = require('express');
const mongoose = require('mongoose');
const upload = require('../config/multer');
const Pet = require('../models/pets');
const Photo = require('../models/photo');
const { uploadFileToGCS } = require('../services/googleCloudStorage');
const router = express.Router();

router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const { petId } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const pet = await Pet.findById(petId);
        if (!pet) {
            return res.status(404).json({ error: 'Pet not found' });
        }

        const { filename, url } = await uploadFileToGCS(req.file);

        const photo = new Photo({
            url: url,
            filename: filename,
            metadata: { petId: petId }
        });

        await photo.save();
        pet.photos.push(photo._id);
        await pet.save();

        return res.status(201).json({ message: 'Photo uploaded successfully', photoId: photo._id });
    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:petId/photos', async (req, res) => {
    try {
        const { petId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(petId)) {
            return res.status(400).json({ error: 'Invalid pet ID' });
        }

        const pet = await Pet.findById(petId).populate('photos');
        if (!pet) {
            return res.status(404).json({ error: 'Pet not found' });
        }

        res.status(200).json({ photos: pet.photos });
    } catch (error) {
        console.error('Retrieval error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
*/