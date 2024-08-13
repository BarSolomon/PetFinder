const mongoose = require('mongoose');
const Photo = require('../models/photo');
const Pet = require('../models/pets');
const { uploadFile, getFileStream,deleteFile  } = require('../services/googleCloudStorage');
// Upload photo for a pet
const uploadPhotos = async (req, res) => {
    const { petId } = req.body;

    try {
        const pet = await Pet.findById(petId);
        if (!pet) {
            return res.status(404).json({ error: 'Pet not found' });
        }
        if (pet.photos.length >= 10) {
            return res.status(400).json({ error: 'Maximum number of photos (10) reached' });
        }

        const files = req.files;
        const photos = [];

        for (const file of files) {
            const photo = new Photo({
                pet: petId,
                uploadedAt: new Date()
            });

            const result = await uploadFile(file, photo._id);
            photo.url = result.url;
            photo.filename = `${photo._id}-${file.originalname}`;

            await photo.save();
            pet.photos.push(photo._id);
            photos.push(photo);
        }

        await pet.save();

        res.status(201).json({ message: 'Photos uploaded successfully', photos });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get photos by pet ID
const getPhotosByPetId = async (req, res) => {
    const { petId } = req.params;

    try {
        const pet = await Pet.findById(petId).populate('photos');
        if (!pet) {
            return res.status(404).json({ error: 'Pet not found' });
        }

        const photos = await Photo.find({ pet: new mongoose.Types.ObjectId(petId) });

        res.status(200).json(photos);
    } catch (error) {
        console.error('Retrieval error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }

};
const downloadPhoto = async (req, res) => {
    const { photoId } = req.params;

    try {
        const photo = await Photo.findById(photoId);
        if (!photo) {
            return res.status(404).json({ error: 'Photo not found' });
        }

        const readStream = await getFileStream(photo.filename);
        readStream.pipe(res);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Download all photos by pet ID
const downloadAllPhotosByPetId = async (req, res) => {
    const { petId } = req.params;

    try {
        const pet = await Pet.findById(petId).populate('photos');
        if (!pet) {
            return res.status(404).json({ error: 'Pet not found' });
        }

        const photos = await Photo.find({ pet: new mongoose.Types.ObjectId(petId) });
        if (photos.length === 0) {
            return res.status(404).json({ error: 'No photos found for this pet' });
        }

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=${pet.name}-photos.json`);

        const data = [];

        for (const photo of photos) {
            const readStream = await getFileStream(photo.filename);
            const buffers = [];
            readStream.on('data', (chunk) => buffers.push(chunk));
            await new Promise((resolve, reject) => {
                readStream.on('end', () => {
                    const buffer = Buffer.concat(buffers);
                    data.push({
                        filename: photo.filename,
                        data: buffer.toString('base64')
                    });
                    resolve();
                });
                readStream.on('error', (err) => reject(err));
            });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Download all photos error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const deletePhoto = async (req, res) => {
    const { photoId } = req.params;

    try {
        const photo = await Photo.findById(photoId);
        if (!photo) {
            return res.status(404).json({ error: 'Photo not found' });
        }

        const pet = await Pet.findById(photo.pet);
        if (!pet) {
            return res.status(404).json({ error: 'Pet not found' });
        }

        // Remove photo from GCS
        await deleteFile(photo.filename);

        // Remove photo reference from pet's array
        pet.photos = pet.photos.filter(id => id.toString() !== photoId);
        await pet.save();

        // Delete photo document from MongoDB
        await Photo.deleteOne({ _id: photoId });

        res.status(200).json({ message: 'Photo deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    uploadPhotos,
    getPhotosByPetId,
    downloadPhoto,
    downloadAllPhotosByPetId,
    deletePhoto
};