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

async function generateSignedUrl(filename) {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filename);

    const [url] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 1000 * 60 * 60, // 1 hour
    });

    return url;
}
/* GenerateSingedfor all file names.
* */
async function generateSignedUrls(filenames) {
    const signedUrls = [];

    for (const filename of filenames) {
        const url = await generateSignedUrl(filename);
        signedUrls.push(url);
    }

    return signedUrls;
}

module.exports = {
    uploadFile,
    getFileStream,
    deleteFile,
    generateSignedUrl,
    generateSignedUrls
};