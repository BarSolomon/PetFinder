/*
מחלקה זו מייצגת חיית מחמד במערכת.
 היא מאפשרת יצירה, עדכון ומחיקה של פרטי חיית מחמד, כולל פרטים כמו שם, תיאור, תמונות וכו'.
Represents a pet in the system.
It allows for creating, updating, and deleting pet details,
including attributes like name, description, and images.
 */


const mongoose = require('mongoose');
const User = require('./users');

const PetSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    images: [{
        type: String
    }],
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
    }
});

//return all the pets that lost
PetSchema.statics.findLostPets = async function() {
    return this.find({ isLost: true });
};

//return all owner's pets
PetSchema.statics.findPetsByOwnerEmail = async function(ownerEmail) {
    // find the user by his mail
    const owner = await User.findOne({ email: ownerEmail });
    if (!owner) {
        throw new Error('Owner not found');
    }

    // return all the pets that belong to this owner
    return this.find({ owner: owner._id });
};

//delete pet by his id
PetSchema.statics.deletePet  = async function(petId, ownerId) {
    try {
        //check if the pet is belong to this owner
        const pet = await this.findOne({ _id: petId, owner: ownerId });

        if (!pet) {
            // pet not fount OR pet don't belong to this owner
            return { success: false, message: 'error - there is no pet or permition to delete' };
        }

        // delete the pet from DB
        await this.deleteOne({ _id: petId });

        // update owner's list of pets
        await User.updateOne({ _id: ownerId }, { $pull: { pets: petId } });

        return { success: true, message: 'pet delete' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'error' };
    }
}

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
