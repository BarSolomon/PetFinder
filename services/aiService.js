const axios = require('axios');
const Pet = require('../models/pets');
const BreedPrediction = require('../models/BreedPrediction');
const { generateSignedUrls } = require('../services/googleCloudStorage');
/// need to fix generateSignedURLS
async function classifyAndStoreBreeds(petId) {
    try {
        // Find the pet by ID and populate the photos array
        const pet = await Pet.findById(petId).populate('photos');
        if (!pet) {
            throw new Error('Pet not found');
        }

        // Extract the filenames from the photos array
        const filenames = pet.photos.map(photo => photo.filename);

        // Generate signed URLs for each photo
        const photoUrls = await generateSignedUrls(filenames);

        // Send the photo URLs to the AI server for classification
        const response = await axios.post('https://petfinder-ai-kflw7id5la-as.a.run.app/best_classify', {
            image_urls: photoUrls
        });

        // Extract the predictions from the response
        const predictions = response.data.predictions;

        // Create a new BreedPrediction document and save it
        const breedPrediction = new BreedPrediction({
            pet: petId,
            predictions
        });
        await breedPrediction.save();

        // Update the pet document to reference the new BreedPrediction
        pet.breeds_predictions = breedPrediction._id;
        await pet.save();

        return breedPrediction;
    } catch (error) {
        console.error('Error in classifyAndStoreBreeds:', error);
        throw error;
    }
}


module.exports = {
    classifyAndStoreBreeds
};
