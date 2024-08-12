const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Pet = require('../models/pets');

dotenv.config();

const updatePhotosField = async () => {
    await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    const pets = await Pet.find({ photos: { $type: 'objectId' } });

    for (let pet of pets) {
        pet.photos = [pet.photos];
        await pet.save();
    }

    console.log('Updated all documents with photos field as an objectId to an array.');
    mongoose.connection.close();
};

updatePhotosField().catch(err => console.error(err));
