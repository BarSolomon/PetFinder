/*
מחלקה זו מייצגת חיית מחמד במערכת.
 היא מאפשרת יצירה, עדכון ומחיקה של פרטי חיית מחמד, כולל פרטים כמו שם, תיאור, תמונות וכו'.
Represents a pet in the system.
It allows for creating, updating, and deleting pet details,
including attributes like name, description, and images.
 */

const mongoose = require('mongoose');

const PetSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    breed: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['Dog', 'Cat', 'Other']
    },
    gender: {
        type: String,
        required: true,
        enum: ['Male', 'Female']
    },
    description: {
        type: String
    },
    isLost: {
        type: Boolean,
        default: false
    },
    city: {
        type: String,
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    photos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Photo'
    }],
    breeds_predictions: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BreedPrediction'
    },
    features: {
        type: Array,
        default: []
    }, // New field for key-value pairs

    lostAd: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GPTInteraction'
    },


    // New field to store geolocation coordinates
    location: { // New field for storing geographic coordinates
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            index: '2dsphere' // Enables geospatial queries
        }
    }

});

// Static methods
PetSchema.statics.findLostPets = async function() {
    return this.find({ isLost: true });
};

PetSchema.statics.findPetsByOwnerEmail = async function(ownerEmail) {
    const owner = await mongoose.model('User').findOne({ email: ownerEmail });
    if (!owner) {
        throw new Error('Owner not found');
    }
    return this.find({ owner: owner._id });
};

PetSchema.statics.findPetByPetID = async function(petId) {
    const pet = await this.findOne({_id: petId})
    if (!pet) {
        throw new Error('no pet found');
    }
    return this.find({_id: petId });
};

PetSchema.statics.deletePet = async function(petId, ownerId) {
    try {
        const pet = await this.findOne({ _id: petId, owner: ownerId });
        if (!pet) {
            return { success: false, message: 'Error - no pet or permission to delete' };
        }
        await this.deleteOne({ _id: petId });
        await mongoose.model('User').updateOne({ _id: ownerId }, { $pull: { pets: petId } });
        return { success: true, message: 'Pet deleted' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Error' };
    }
};

PetSchema.statics.updateLostStatus = async function(petId, isLost) {
    try {
        const pet = await this.findById(petId);
        if (!pet) {
            return { success: false, message: 'Pet not found' };
        }
        pet.isLost = isLost;
        await pet.save();
        return { success: true, message: 'Pet lost status updated successfully' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Internal server error' };
    }
};

module.exports = mongoose.model('Pet', PetSchema);
