const express = require('express');
const { analyzePhotoEndpoint, analyzePetPhotos, getGPTInteractionById } = require('../controllers/gptController');

const router = express.Router();

router.post('/analyze', analyzePhotoEndpoint);
router.post('/analyzePetPhotos', analyzePetPhotos);
router.get('/interaction/:interactionId', getGPTInteractionById);



module.exports = router;
