const express = require('express');
const { createPet, updatePet, deletePet, getLostPets, updateLostStatus } = require('../controllers/petController');
const router = express.Router();

router.post('/new', createPet);
router.put('/:petId', updatePet);
router.delete('/delete', deletePet);
router.get('/lost', getLostPets);
router.put('/:petId/updateLostStatus', updateLostStatus);

module.exports = router;
