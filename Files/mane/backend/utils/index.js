/**
 * Utils Index
 * Export all utilities from a single entry point
 */

const { seedDefaultUser, deleteDefaultUser } = require('./seedUser');

module.exports = {
    seedDefaultUser,
    deleteDefaultUser
};

