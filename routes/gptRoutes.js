const express = require('express');
const { analyzePhotoEndpoint, analyzePetPhotos } = require('../controllers/gptController');

const router = express.Router();

router.post('/analyze', analyzePhotoEndpoint);
router.post('/analyzePetPhotos', analyzePetPhotos);


module.exports = router;
