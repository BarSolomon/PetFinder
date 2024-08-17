const mongoose = require('mongoose');

const BreedPredictionSchema = new mongoose.Schema({
    pet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet',
        required: true
    },
    predictions: [
        {
            breed: { type: String },
            confidence: { type: Number }
        }
    ],
    analyzedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('BreedPrediction', BreedPredictionSchema);
