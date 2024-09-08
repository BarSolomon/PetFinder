const axios = require('axios');

async function getCoordinates(address) {
    const apiKey = process.env.GOOGLE_GEO_LOCATION;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

    try {
        const response = await axios.get(url);
        const data = response.data;

        if (data.status === 'OK') {
            const { lat, lng } = data.results[0].geometry.location;
            return { latitude: lat, longitude: lng };
        } else {
            throw new Error(`Geocoding error: ${data.status}`);
        }
    } catch (error) {
        console.error('Error fetching coordinates:', error.message);
        throw error;
    }
}


async function getAddressFromCoordinates(lat, lng) {
    const apiKey = process.env.GOOGLE_GEO_LOCATION; // Replace with your actual API key
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lng},${lat}&key=${apiKey}`
    ;

    try {
        const response = await axios.get(url);
        if (response.data.status === 'OK') {
            const address = response.data.results[0].formatted_address;
            console.log('Full Address:', address);
            return address;
        } else {
            console.error('Error fetching address:', response.data.status);
            return null;
        }
    } catch (error) {
        console.error('Error with API request:', error);
        return null;
    }
}


module.exports = {
    getCoordinates, getAddressFromCoordinates
};
