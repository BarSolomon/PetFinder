const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

let gfs;

const initGridFS = (db) => {
    gfs = new GridFSBucket(db, { bucketName: 'photos' });
};

const getGFS = () => gfs;

module.exports = {
    initGridFS,
    getGFS
};
