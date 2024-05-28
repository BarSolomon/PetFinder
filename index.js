/*
מחלקה זו מהווה את נקודת הכניסה ליישום,
 היא מגדירה את הפורט, יוצרת את השרת, ומנהלת את כלל רשימת הנתיבים באפליקציה.
Acts as the entry point to the application. It defines the port,
creates the server, and manages all the routes in the application.
 */


const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const dotenv = require('dotenv');
const connectDB = require('./config/config');
const passport = require('./config/passportConfig');
const User = require('./models/users');
const Pet = require('./models/pets');
const fs = require('fs');


//load the Environment Variables
dotenv.config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3000;

//connect to the MongoDB
connectDB();


//middleware
app.use(express.json());
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

require('./config/passportConfig');

//route - connect with google
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

//route - callback, check if auth is good
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), async (req, res) => {
    res.redirect('/');
});

//route - check if the connect is good
app.get('/api/current_user', (req, res) => {
    res.send(req.user);
});

//route - user logout
app.get('/api/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

//route - update user phone
app.post('/api/update_phone', async (req, res) => {
    const { email, phone } = req.body;

    try {
        const user = await User.findOneAndUpdate({ email }, { phone }, { new: true });
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.send(user);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

//route - update user city
app.post('/api/update_city', async (req, res) => {
    const { email, city } = req.body;

    try {
        const user = await User.findOneAndUpdate({ email }, { city }, { new: true });
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.send(user);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

//route - create new pet
app.post('/api/pets/new', async (req, res) => {
    try {
        const { name, images, age, breed, type, gender, description, isLost, city, ownerEmail } = req.body;

        // Check if the owner with the given email exists
        const owner = await User.findOne({ email: ownerEmail });
        if (!owner) {
            return res.status(404).json({ error: 'Owner not found' });
        }

        // Create a new pet
        const newPet = new Pet({
            name,
            images,
            age,
            breed,
            type,
            gender,
            description,
            isLost,
            city,
            owner: owner._id
        });

        // Save the pet to the database
        await newPet.save();

        // Add the pet to the owner's collection
        owner.pets.push(newPet);
        await owner.save();

        return res.status(201).json({ message: 'Pet added successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

//route - delete pet
app.delete('/api/pets/delete', async (req, res) => {
    try {
        const { petId, ownerId } = req.body;
        const result = await Pet.deletePet(petId, ownerId);

        // check if it success
        if (result.success) {
            res.status(200).json({ message: result.message });
        } else {
            res.status(400).json({ error: result.message });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'error111' });
    }
});

// route - get all lost pets
app.get('/api/pets/lost', async (req, res) => {
    try {
        const lostPets = await Pet.findLostPets();
        res.status(200).json(lostPets);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// route - update pet lost status
app.put('/api/pets/:petId/updateLostStatus', async (req, res) => {
    try {
        const { petId } = req.params;
        const { isLost } = req.body;

        const pet = await Pet.findById(petId);
        if (!pet) {
            return res.status(404).json({ error: 'Pet not found' });
        }

        pet.isLost = isLost;
        await pet.save();

        res.status(200).json({ message: 'Pet lost status updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//route - base route
app.get('/', (req, res) => {
    res.send('starting the server');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});