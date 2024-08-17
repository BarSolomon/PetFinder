const axios = require('axios');
const Pet = require('../models/pets');
const BreedPrediction = require('../models/breedPrediction');
const { generateSignedUrls } = require('../services/googleCloudStorage');

async function classifyAndStoreBreeds(petId) {
    const photoUrls = await generateSignedUrls(petId);

    const response = await axios.post('http://Nameofserver:8080/best_classify', {
        image_urls: photoUrls
    });

    const predictions = response.data.predictions;

    const breedPrediction = new BreedPrediction({
        pet: petId,
        predictions
    });

    await breedPrediction.save();

    const pet = await Pet.findById(petId);
    pet.breeds_predictions = breedPrediction._id;
    await pet.save();

    return breedPrediction;
}

module.exports = {
    classifyAndStoreBreeds
};
