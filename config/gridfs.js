const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

let gfs;

const initGridFS = (db) => {
    gfs = new GridFSBucket(db, { bucketName: 'photos' });
    console.log('GridFs Connected');
};

const getGFS = () => gfs;

module.exports = {
    initGridFS,
    getGFS
};
