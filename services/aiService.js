const axios = require('axios');
const Pet = require('../models/pets');
const BreedPrediction = require('../models/BreedPrediction');
const { generateSignedUrls } = require('../services/googleCloudStorage');
/// need to fix generateSignedURLS
async function classifyAndStoreBreeds(petId) {
    const photoUrls = await generateSignedUrls(petId);

    const response = await axios.post('https://petfinder-ai-kflw7id5la-as.a.run.app/best_classify', {
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
