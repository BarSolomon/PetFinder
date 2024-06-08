const { Storage } = require('@google-cloud/storage');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const storage = new Storage({
    projectId: process.env.GCLOUD_PROJECT_ID,
    keyFilename: path.join(__dirname, '..', process.env.GCLOUD_KEY_FILE) // Update this line
});

const bucket = storage.bucket(process.env.GCLOUD_BUCKET);

module.exports = bucket;
