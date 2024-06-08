const { Storage } = require('@google-cloud/storage');
const path = require('path');

const storage = new Storage({
    keyFilename: path.join(__dirname, '../resources/petfinderapp-424309-724fe6560661.json'),
    projectId: process.env.GCLOUD_PROJECT_ID,
});

const bucketName = process.env.GCLOUD_BUCKET;

async function uploadFile(file, objectId) {
    const bucket = storage.bucket(bucketName);
    const blob = bucket.file(`${objectId}-${file.originalname}`);
    const blobStream = blob.createWriteStream({
        resumable: false,
    });

    return new Promise((resolve, reject) => {
        blobStream.on('finish', () => {
            resolve({
                url: `https://storage.googleapis.com/${bucket.name}/${blob.name}`
            });
        }).on('error', (err) => {
            reject(err);
        }).end(file.buffer);
    });
}

async function getFileStream(filename) {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filename);
    return file.createReadStream();
}

async function deleteFile(fileName) {
    const bucket = storage.bucket(bucketName);
    await bucket.file(fileName).delete();
}


module.exports = {
    uploadFile,
    getFileStream,
    deleteFile
};

