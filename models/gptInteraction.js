const mongoose = require('mongoose');

const GPTInteractionSchema = new mongoose.Schema({
    petId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet',
        required: true
    },
    photoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Photo',
        required: true
    },
    prompt: {
        type: String,
        required: true
    },
    response: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('GPTInteraction', GPTInteractionSchema);
