const Pet = require('../models/pets');
const User = require('../models/users');
const { classifyAndStoreBreeds } = require('../services/aiService');
const mongoose = require("mongoose");
const BreedPrediction = require('../models/BreedPrediction');
const Photo = require('../models/photo');
const GPTInteraction = require('../models/gptInteraction');
const { deleteFile } = require('../services/googleCloudStorage');
const { getCoordinates,getAddressFromCoordinates } = require('../services/geolocationService');
const PossibleMatch = require('../models/possibleMatch');  // Assuming a new model for storing possible matches
const { findMatchingLostPets, findNearbyPets, storePetMatches } = require('../services/petService');
const { analyzePhoto } = require('../services/gptService');
const { sendMatchNotification } = require('../services/emailService'); // Ensure correct import






const createPet = async (req, res) => {
    try {
        const { name, age, breed, type, gender, description, city, fullAddress, ownerEmail, isPetMine = true, latitude, longitude } = req.body;  // Include latitude and longitude

        const owner = await User.findOne({ email: ownerEmail });
        if (!owner) {
            return res.status(404).json({ error: 'Owner not found' });
        }

        let coordinates;

        if (latitude !== undefined && longitude !== undefined) {
            // Use provided coordinates
            coordinates = [longitude, latitude];  // Ensure correct order: [longitude, latitude]
            console.log('Using provided coordinates:', coordinates);
        } else {
            // Fetch coordinates for the full address
            const coords = await getCoordinates(fullAddress);
            console.log('Fetched coordinates:', coords);

            // Ensure correct order: [longitude, latitude]
            coordinates = coords && coords.longitude !== undefined && coords.latitude !== undefined
                ? [coords.longitude, coords.latitude]
                : null;

            if (!coordinates) {
                return res.status(400).json({ error: 'Invalid address or unable to fetch coordinates.' });
            }
        }

        const pet = new Pet({
            name,
            age,
            breed,
            type,
            gender,
            description,
            city,
            fullAddress,
            location: {  // Store as GeoJSON Point
                type: 'Point',
                coordinates
            },
            owner: owner._id,
            isPetMine  // Set the isPetMine field; defaults to true if not provided
        });

        await pet.save();
        owner.pets.push(pet._id);
        await owner.save();

        res.status(201).json({ message: 'Pet created successfully', pet });
    } catch (error) {
        console.error('Create pet error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const getPetData = async(req, res) =>{
    console.log(req.body);
    try {
        const {petId} = req.body
        const pet = await Pet.findPetByPetID(petId);
        if (!pet){
            return res.status(404).json({erorr: 'pet not found'})
    }
        res.status(200).json(pet);
    }catch (error) {
        console.error('Pet not found:', error);
        res.status(500).json({error: 'Internal server error'})
    }
};

const updatePet = async (req, res) => {
    try {
        const { petId } = req.params; // Extract pet ID from URL parameters
        const updateData = req.body;  // Extract fields to update from request body

        // Fetch the pet document by ID
        const pet = await Pet.findById(petId);

        if (!pet) {
            return res.status(404).json({ error: 'Pet not found' });
        }

        // Check if fullAddress is being updated and fetch new coordinates
        if (updateData.fullAddress) {
            const coords = await getCoordinates(updateData.fullAddress);

            console.log('Fetched coordinates for update:', coords);

            // Ensure correct order: [longitude, latitude]
            const coordinates = coords && coords.longitude !== undefined && coords.latitude !== undefined
                ? [coords.longitude, coords.latitude] // Correct order
                : null;

            if (!coordinates) {
                return res.status(400).json({ error: 'Invalid address or unable to fetch coordinates.' });
            }

            // Update the location field
            pet.location = {
                type: 'Point',
                coordinates
            };

            pet.fullAddress = updateData.fullAddress; // Update full address
        }

        // Update only the provided fields in updateData
        if (updateData.name) pet.name = updateData.name;
        if (updateData.age) pet.age = updateData.age;
        if (updateData.breed) pet.breed = updateData.breed;
        if (updateData.type) pet.type = updateData.type;
        if (updateData.gender) pet.gender = updateData.gender;
        if (updateData.description) pet.description = updateData.description;
        if (updateData.isLost !== undefined) pet.isLost = updateData.isLost;
        if (updateData.city) pet.city = updateData.city;
        if (updateData.owner) pet.owner = updateData.owner;

        // Save the updated pet document
        await pet.save();

        res.status(200).json({ message: 'Pet updated successfully', pet });
    } catch (error) {
        console.error('Update pet error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const deletePet = async (req, res) => {
    const { petId, ownerId } = req.body;

    try {
        const pet = await Pet.findOne({ _id: petId, owner: ownerId });
        if (!pet) {
            return res.status(404).json({ error: 'Pet not found or permission denied' });
        }

        // Iterate over the photos array in the pet document
        for (const photoId of pet.photos) {
            try {
                const photo = await Photo.findById(photoId);
                if (photo) {
                    try {
                        await deleteFile(photo.filename); // Delete from Google Cloud Storage
                    } catch (err) {
                        console.error(`Failed to delete photo from GCS: ${err}`);
                    }
                }
                try {
                    await Photo.deleteOne({ _id: photoId }); // Delete photo document from MongoDB
                } catch (err) {
                    console.error(`Failed to delete photo document from MongoDB: ${err}`);
                }
            } catch (err) {
                console.error(`Failed to find photo by ID: ${err}`);
            }
        }

        // Delete breed predictions if they exist
        if (pet.breeds_predictions) {
            try {
                await BreedPrediction.deleteOne({ _id: pet.breeds_predictions });
            } catch (err) {
                console.error(`Failed to delete breed predictions: ${err}`);
            }
        }

        // Delete LostAD if it exists
        if (pet.lostAd) {
            try {
                await GPTInteraction.deleteOne({ _id: pet.lostAd });
            } catch (err) {
                console.error(`Failed to delete LostAD: ${err}`);
            }
        }

        // Remove pet reference from user's pets array
        try {
            await User.updateOne({ _id: ownerId }, { $pull: { pets: petId } });
        } catch (err) {
            console.error(`Failed to remove pet reference from user: ${err}`);
        }

        // Delete the pet document from MongoDB
        try {
            await Pet.deleteOne({ _id: petId });
        } catch (err) {
            console.error(`Failed to delete pet document from MongoDB: ${err}`);
        }

        res.status(200).json({ message: 'Pet and all associated data deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
const getLostPets = async (req, res) => {
    try {
        const lostPets = await Pet.findLostPets();
        res.status(200).json(lostPets);
    } catch (error) {
        console.error('Get lost pets error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
const updateLostStatus = async (req, res) => {
    try {
        const { petId } = req.params;
        const { isLost } = req.body;

        const result = await Pet.updateLostStatus(petId, isLost);

        if (!result.success) {
            return res.status(400).json({ error: result.message });
        }

        res.status(200).json({ message: result.message });
    } catch (error) {
        console.error('Update lost status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
const getPetsByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;
        const objectId = new mongoose.Types.ObjectId(userId); // שימוש ב-'new' ליצירת ObjectId
        const pets = await Pet.find({ owner: objectId });

        res.status(200).json(pets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const classifyPetBreeds = async (req, res) => {
    const { petId } = req.params;

    try {
        const breedPrediction = await classifyAndStoreBreeds(petId);
        res.status(200).json({
            message: 'Breed predictions stored successfully',
            breedPrediction
        });
    } catch (error) {
        console.error('Error classifying breeds:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
const getBreedPrediction = async (req, res) => {
    const { petId, breedPredictionId } = req.query;

    try {
        let breedPrediction;

        if (breedPredictionId) {
            // If breedPredictionId is provided, fetch the breed prediction directly
            breedPrediction = await BreedPrediction.findById(breedPredictionId);
        } else if (petId) {
            // If petId is provided, fetch the pet and then retrieve the breed prediction using the reference
            const pet = await Pet.findById(petId).populate('breeds_predictions');
            breedPrediction = pet.breeds_predictions;
        }

        // If breed prediction is not found or the predictions array is null, classify and store breeds
        if (!breedPrediction || (breedPrediction && (!breedPrediction.predictions || breedPrediction.predictions.length === 0))) {
            console.log('Predictions not found or empty. Classifying and storing breeds...');

            // Call the classifyAndStoreBreeds function to get new predictions
            breedPrediction = await classifyAndStoreBreeds(petId);

            if (!breedPrediction) {
                return res.status(404).json({ error: 'Breed prediction could not be generated.' });
            }
        }

        res.status(200).json(breedPrediction);
    } catch (error) {
        console.error('Error retrieving breed prediction:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
const findMatch = async (req, res) => {
    const { petId } = req.params;

    try {
        console.log(`Starting match process for pet ID: ${petId}`);

        // Step 1: Retrieve the pet by ID and check if it has photos
        console.log(`Retrieving pet information for ID: ${petId}`);
        const pet = await Pet.findById(petId).populate('photos');
        if (!pet) {
            console.log(`Pet not found for ID: ${petId}`);
            return res.status(404).json({ error: 'Pet not found' });
        }
        console.log(`Pet found: ${pet.name} (ID: ${petId}) with ${pet.photos.length} photo(s)`);

        if (!pet.photos || pet.photos.length === 0) {
            console.log(`No photos available for pet ID: ${petId}`);
            return res.status(400).json({ error: 'No photos available for this pet.' });
        }

        // Step 2: Classify and store breed predictions
        console.log(`Classifying breeds for pet ID: ${petId}`);
        const breedPrediction = await classifyAndStoreBreeds(petId);
        console.log(`Breed predictions stored for pet ID: ${petId}:`, breedPrediction.predictions);

        // Step 3: Analyze pet data using GPT
        console.log(`Formatting breed predictions for GPT prompt for pet ID: ${petId}`);
        const formattedBreedPredictions = breedPrediction.predictions
            .map(prediction => `${prediction.breed} (confidence: ${prediction.confidence * 100}%)`)
            .join(', ');

        const prompt = `
                        You are provided with a pet photo and a list of breed predictions. Analyze the pet photo and use the breed predictions as a reference to fill in the pet schema JSON with the following details. Only provide fields that can be determined from the photo or the breed predictions:
                        
                        1. type: Either "Dog" or "Cat".
                        2. age: An approximate age from 0 to 20.
                        3. gender: Either "Female" or "Male".
                        4. breed: identifying your picture you will try to interpret what kind of dog it is Choose from confidence breed In addition, if there is more confidence than the rest, choose it
                        5. description: A brief description of the pet's appearance or any distinctive features that unique for the dog(maximum 2 lines).
                        
                        Please provide the response in the following JSON format:
                        
                        {
                          "type": "Dog",
                          "age": 5,
                          "gender": "Male",
                          "breed": "Labrador",
                          "description": "Medium-sized with a shiny black coat and friendly demeanor."
                        }
                        
                        List of breed predictions: ${formattedBreedPredictions}
                        
                        Analyze the pet photo and provide the best possible response based on the given criteria.
                                `;

        const analysisResults = [];
        console.log(`Starting GPT analysis for pet ID: ${petId}`);

        // Step 3.2: Use the analyzePhoto function for each photo
        for (const photo of pet.photos) {
            console.log(`Analyzing photo ID: ${photo._id} for pet ID: ${petId}`);
            const analysis = await analyzePhoto(photo.filename, prompt);
            console.log(`Analysis result for photo ID: ${photo._id}:`, analysis);
            const cleanedAnalysis = cleanJsonResponse(analysis);
            console.log('cleaned analyse' ,cleanedAnalysis);


            // Store the GPT interaction
            const gptInteraction = new GPTInteraction({
                petId,
                photoId: photo._id,
                prompt,
                response: analysis
            });
            await gptInteraction.save();
            console.log(`Stored GPT interaction for photo ID: ${photo._id} in pet ID: ${petId}`);
            const gptResponse = cleanedAnalysis; // Parse cleaned response

            // Update pet schema fields based on GPT response
            if (gptResponse.type) pet.type = gptResponse.type;
            if (gptResponse.age) pet.age = gptResponse.age;
            if (gptResponse.gender) pet.gender = gptResponse.gender;
            if (gptResponse.breed) pet.breed = gptResponse.breed;
            if (gptResponse.description) pet.description = gptResponse.description;
            analysisResults.push(gptResponse);
        }

        await pet.save();
        console.log(`Pet schema updated based on GPT response for pet ID: ${petId}`);

        // Step 4: Find nearby pets and store matches
        console.log(`Finding nearby pets for pet ID: ${petId}`);
        const nearbyPets = await findMatchingLostPets(petId, { isLost: true });
        console.log(`Found ${nearbyPets.length} nearby pets matching criteria for pet ID: ${petId}`);

        const petMatchesid =  await storePetMatches(petId, nearbyPets);
        console.log(`Stored matches for pet ID: ${petId}`);

        // Step 4.3: Extract owner details for matched pets
        console.log(`Retrieving owner details for matched pets for pet ID: ${petId}`);
        const matchedPetDetails = await Promise.all(
            nearbyPets.map(async (matchedPetId) => {
                const matchedPet = await Pet.findById(matchedPetId).populate('owner');

                // Extract only necessary fields from owner
                const ownerDetails = {
                    name: `${matchedPet.owner.firstName} ${matchedPet.owner.lastName}`,
                    phone: matchedPet.owner.phone,
                    email: matchedPet.owner.email
                };

                try {
                    const petFounder = await Pet.findById(petId).populate('owner');
                    const petLocation = pet.location;
                    const fullAddress = await getAddressFromCoordinates(petLocation.coordinates[0],petLocation.coordinates[1]);
                    console.log(`Converting cordinates ${petLocation.coordinates} Result : ${fullAddress} `);

                    // Send the photos of the original pet instead of the matched pet
                    await sendMatchNotification(ownerDetails, pet.photos.map(photo => photo.filename), matchedPet, petFounder.owner, fullAddress);
                    console.log(`Email sent to owner (${ownerDetails.email}) about possible match for pet: ${matchedPet.name}`);
                } catch (error) {
                    console.error(`Failed to send email to ${ownerDetails.email}:`, error);
                }



                // Return matched pet details with minimal owner information
                return {
                    pet: {
                        _id: matchedPet._id,
                        name: matchedPet.name,
                        age: matchedPet.age,
                        breed: matchedPet.breed,
                        type: matchedPet.type,
                        gender: matchedPet.gender,
                        description: matchedPet.description,
                        isLost: matchedPet.isLost,
                        city: matchedPet.city,
                        location: matchedPet.location,
                        photos: matchedPet.photos,
                        features: matchedPet.features,
                        isPetMine: matchedPet.isPetMine,
                        breeds_predictions: matchedPet.breeds_predictions,
                    },
                    owner: ownerDetails ,
                    PossibleMatch: petMatchesid
                };
            })
        );


        console.log(`Match analysis complete for pet ID: ${petId}`);
        res.status(200).json({ message: 'Match analysis complete.', matches: matchedPetDetails });
    } catch (error) {
        console.error('Error finding match:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
const cleanJsonResponse = (response) => {
    try {
        // Remove code block delimiters and any text before/after the JSON
        const cleaned = response.replace(/```json|```/g, '').trim();

        // Extract only the JSON content from the string
        const jsonMatch = cleaned.match(/{[\s\S]*}/);

        if (jsonMatch) {
            // Parse the JSON to ensure it's valid
            const jsonResponse = JSON.parse(jsonMatch[0]);
            return jsonResponse;
        } else {
            throw new Error("No valid JSON found in the response.");
        }
    } catch (error) {
        console.error("Error cleaning JSON response:", error);
        return null;  // Return null or handle the error as needed
    }
};
const getPetCoordinates = async (req, res) => {
    const { petId } = req.params;  // Extract pet ID from the request parameters

    try {
        console.log(`Starting coordinate retrieval process for pet ID: ${petId}`);

        // Step 1: Retrieve the pet by ID and check if it has coordinates
        console.log(`Retrieving pet information for ID: ${petId}`);
        const pet = await Pet.findById(petId).select('location');

        if (!pet) {
            console.log(`Pet not found for ID: ${petId}`);
            return res.status(404).json({ error: 'Pet not found' });
        }

        console.log(`Pet found for ID: ${petId}`);

        if (!pet.location || !pet.location.coordinates) {
            console.log(`No coordinates available for pet ID: ${petId}`);
            return res.status(404).json({ error: 'Coordinates not available for this pet.' });
        }

        // Step 2: Return the pet's coordinates
        console.log(`Returning coordinates for pet ID: ${petId}`, pet.location.coordinates);
        res.status(200).json({ coordinates: pet.location.coordinates });

        console.log(`Coordinates retrieval process complete for pet ID: ${petId}`);
    } catch (error) {
        console.error('Error fetching pet coordinates:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createPet,
    updatePet,
    deletePet,
    getLostPets, updateLostStatus,
    getPetsByUserId, classifyPetBreeds,
    getPetData, getBreedPrediction, findMatch , getPetCoordinates

};
