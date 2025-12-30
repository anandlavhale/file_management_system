/**
 * Models Index
 * Export all models from a single entry point
 */

const User = require('./User');
const FileRecord = require('./FileRecord');
const College = require('./College');

module.exports = {
    User,
    FileRecord,
    College
};

