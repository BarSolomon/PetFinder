const express = require('express');
const { analyzePhotoEndpoint, analyzePetPhotos, getGPTInteractionById, updateInteractionResponse } = require('../controllers/gptController');

const router = express.Router();

router.post('/analyze', analyzePhotoEndpoint);
router.post('/analyzePetPhotos', analyzePetPhotos);
router.get('/interaction/', getGPTInteractionById);
router.put('/interaction/', updateInteractionResponse);



module.exports = router;
