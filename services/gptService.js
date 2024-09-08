const { OpenAI } = require('openai');
const { generateSignedUrl } = require('../services/googleCloudStorage');
const mongoose = require('mongoose');
const Pet = require('../models/pets');
const Photo = require('../models/photo');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function analyzePhoto(filename, prompt) {
    const photoUrl = await generateSignedUrl(filename);

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4-turbo',
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        { type: 'image_url', image_url: { url: photoUrl } }
                    ]
                }
            ],
            max_tokens: 2000,
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('GPT analysis error:', error);
        throw error;
    }
}

async function testGPTConnection() {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4-turbo',
            messages: [{ role: 'system', content: 'Test GPT connection' }],
            max_tokens: 10,
        });
        console.log('GPT connected successfully:', response.choices[0].message.content.trim());
    } catch (error) {
        console.error('GPT connection error:', error);
    }
}

async function processPetPhotos(petId) {
    const pet = await Pet.findById(petId).populate('photos');
    if (!pet) {
        throw new Error('Pet not found');
    }

    const photoUrls = [];
    const photoIds = [];

    for (const photoId of pet.photos) {
        const photo = await Photo.findById(photoId);
        if (photo) {
            const url = await generateSignedUrl(photo.filename);
            photoUrls.push(url);
            photoIds.push(photoId);
        }
    }

    if (photoUrls.length === 0) {
        throw new Error('No photos found for this pet');
    }

    const prompt = "Extract the following features of the dog from the photo: species (common and scientific name), coloration and patterns, size and shape, fur/feathers/scales (type and texture), eyes (size, color, shape), ears (size, shape, position), mouth and nose (shape, size, distinctive features), legs (number, length, type), tail (presence, length, features), wings/fins (size, shape if applicable), posture, activity, surroundings, additional features, and return the answer in JSON format."





    const keyValueResponses = await analyzePhotosBulk(photoUrls, prompt);

    const featuresArray = keyValueResponses.map((keyValue, index) => ({
        photoId: photoIds[index],
        keyValue: JSON.parse(keyValue)
    }));

    pet.features = featuresArray;
    await pet.save();

    return { features: featuresArray, numberOfPhotos: photoUrls.length };
}


async function analyzePhotosBulk(photoUrls, prompt) {
    try {
        const messages = [
            {
                role: 'user',
                content: `${prompt}\n${photoUrls.map(url => `Photo: ${url}`).join('\n')}`
            }
        ];

        const response = await openai.chat.completions.create({
            model: 'gpt-4-turbo',
            messages: messages,
            max_tokens: 2000,
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('GPT analysis error:', error);
        throw error;
    }
}


module.exports = {
    analyzePhoto,
    testGPTConnection,
    processPetPhotos,
    analyzePhotosBulk
};
