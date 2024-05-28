const { Storage } = require('@google-cloud/storage');
const path = require('path');

// create storage object
const storage = new Storage({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    keyFilename: path.join(__dirname, '../', process.env.GOOGLE_CLOUD_KEYFILE),
});

const bucketName = 'your-bucket-name'; // need to change to our bucket

const uploadFile = async (filePath, destination) => {
    await storage.bucket(bucketName).upload(filePath, {
        destination,
    });
    console.log(`${filePath} uploaded to ${bucketName}`);
};

module.exports = {
    uploadFile,
};