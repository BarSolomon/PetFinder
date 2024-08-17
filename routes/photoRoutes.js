const express = require('express');
const { uploadPhotos, getPhotosByPetId, downloadPhoto, downloadAllPhotosByPetId, deletePhoto,generatePhotoUrlsByPetId } = require('../controllers/photoController');
const upload = require('../config/multer');
const router = express.Router();

router.post('/upload', upload.array('files', 10), uploadPhotos);
router.get('/:petId/photos', getPhotosByPetId);
router.get('/:photoId/download', downloadPhoto);
router.get('/:petId/downloadAll', downloadAllPhotosByPetId);
router.delete('/:photoId', deletePhoto); // New endpoint for deleting a photo
router.get('/generate-urls/:petId', generatePhotoUrlsByPetId);


module.exports = router;
