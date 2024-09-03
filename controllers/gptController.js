const { analyzePhoto , processPetPhotos  } = require('../services/gptService');
const GPTInteraction = require('../models/gptInteraction'); // Import the GPTInteraction model
const Pet = require('../models/pets'); // Import the Pet model
const Photo = require('../models/photo'); // Import the Photo model

const analyzePhotoEndpoint = async (req, res) => {
    const { filename, prompt } = req.body;

    try {
        // Extract the photoId from the filename
        const [photoId] = filename.split('-');

        // Find the Photo document using the photoId
        const photo = await Photo.findById(photoId);
        if (!photo) {
            return res.status(404).json({ message: 'Photo not found' });
        }

        // Get the petId from the Photo document
        const petId = photo.pet;

        // Perform GPT analysis using the analyzePhoto function
        const analysis = await analyzePhoto(filename, prompt);

        // Store the GPT response in the GPTInteraction collection
        const gptInteraction = new GPTInteraction({
            petId,
            photoId,
            prompt,
            response: analysis
        });
        await gptInteraction.save();

        // Update the Photo document with the GPTInteraction reference
        photo.gptInteraction = gptInteraction._id;
        await photo.save();

        // Update the Pet document with the LostAD reference to GPTInteraction
        const pet = await Pet.findById(petId);
        pet.lostAd = gptInteraction._id;
        await pet.save();

        // Respond with the GPT analysis and the document ID
        res.status(200).json({
            analysis: analysis,
            documentId: gptInteraction._id
        });
    } catch (error) {
        console.error('GPT analysis error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const getGPTInteractionById = async (req, res) => {
    const { interactionId } = req.params;

    try {
        const interaction = await GPTInteraction.findById(interactionId);

        if (!interaction) {
            return res.status(404).json({ message: 'GPT interaction not found' });
        }

        res.status(200).json(interaction);
    } catch (error) {
        console.error('Error fetching GPT interaction:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const updateInteractionResponse = async (req, res) => {
    const { id } = req.params; // Extract the interaction ID from the URL
    const { response } = req.body; // Extract the new response from the request body

    if (!response) {
        return res.status(400).json({ error: 'Response is required.' });
    }

    try {
        // Find the GPT interaction by ID and update the response field only
        const updatedInteraction = await GPTInteraction.findByIdAndUpdate(
            id,
            { response }, // Only updating the 'response' field
            { new: true, runValidators: true } // Return the updated document and run validators
        );

        if (!updatedInteraction) {
            return res.status(404).json({ error: 'Interaction not found' });
        }

        res.status(200).json({
            message: 'Interaction response updated successfully',
            updatedInteraction
        });
    } catch (error) {
        console.error('Error updating interaction response:', error);
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

module.exports = { analyzePhotoEndpoint ,analyzePetPhotos,getGPTInteractionById,updateInteractionResponse };
