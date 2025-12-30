/**
 * Middlewares Index
 * Export all middlewares from a single entry point
 */

const { protect, authorize } = require('./authMiddleware');
const { upload, handleMulterError } = require('./uploadMiddleware');
const { notFound, errorHandler } = require('./errorMiddleware');

module.exports = {
    protect,
    authorize,
    upload,
    handleMulterError,
    notFound,
    errorHandler
};

