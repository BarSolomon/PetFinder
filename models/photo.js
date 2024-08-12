const mongoose = require('mongoose');

const PhotoSchema = new mongoose.Schema({
    pet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet',
        required: true
    },
    url: {
        type: String,
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now,
        required: true
    },
    filename: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Photo', PhotoSchema);
