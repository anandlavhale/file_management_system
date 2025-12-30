/**
 * Controllers Index
 * Export all controllers from a single entry point
 */

const authController = require('./authController');
const fileController = require('./fileController');

module.exports = {
    authController,
    fileController
};

