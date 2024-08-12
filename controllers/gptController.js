const { analyzePhoto , processPetPhotos  } = require('../services/gptService');

const analyzePhotoEndpoint = async (req, res) => {
    const { filename, prompt } = req.body;
    try {
        const analysis = await analyzePhoto(filename, prompt);
        res.status(200).json({ analysis });
    } catch (error) {
        console.error('GPT analysis error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const analyzePetPhotos = async (req, res) => {
    const { petId } = req.body;

    try {
        const result = await processPetPhotos(petId);
        res.status(200).json(result);
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { analyzePhotoEndpoint ,analyzePetPhotos };
