const mongoose = require('mongoose');

const PossibleMatchSchema = new mongoose.Schema({
    petId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet',
        required: true
    },
    matches: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet'
    }]
});

module.exports = mongoose.model('PossibleMatch', PossibleMatchSchema);
