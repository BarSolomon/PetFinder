const express = require('express');
const { getBreedPrediction } = require('../controllers/petController');
const { getPetData , classifyPetBreeds, createPet, updatePet, deletePet, getLostPets, updateLostStatus, getPetsByUserId } = require('../controllers/petController');
const router = express.Router();

router.post('/new', createPet);
router.put('/:petId', updatePet);
router.delete('/delete', deletePet);
router.get('/lost', getLostPets);
router.put('/:petId/updateLostStatus', updateLostStatus);
router.get('/user/:userId/AllpetsById', getPetsByUserId);
router.get('/getPetData',getPetData);
//Ai secection
router.post('/classify/:petId', classifyPetBreeds);
router.get('/breed-prediction', getBreedPrediction);


module.exports = router;
