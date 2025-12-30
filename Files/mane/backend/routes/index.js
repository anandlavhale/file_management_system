/**
 * Routes Index
 * Export all routes from a single entry point
 */

const authRoutes = require('./authRoutes');
const fileRoutes = require('./fileRoutes');

module.exports = {
    authRoutes,
    fileRoutes
};

