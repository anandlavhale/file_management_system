/**
 * File Routes
 * Handles all file management related endpoints
 */

const express = require('express');
const router = express.Router();
const {
    getFileRecords,
    getFileRecord,
    createFileRecord,
    updateFileRecord,
    deleteFileRecord,
    downloadFile,
    exportToExcel,
    getStats
} = require('../controllers/fileController');
const { protect } = require('../middlewares/authMiddleware');
const { upload, handleMulterError } = require('../middlewares/uploadMiddleware');

// All routes are protected
router.use(protect);

// Export route (must be before /:id routes)
router.get('/export', exportToExcel);

// Stats route
router.get('/stats', getStats);

// CRUD routes
router.route('/')
    .get(getFileRecords)
    .post(upload.single('file'), handleMulterError, createFileRecord);

router.route('/:id')
    .get(getFileRecord)
    .put(upload.single('file'), handleMulterError, updateFileRecord)
    .delete(deleteFileRecord);

// Download route
router.get('/:id/download', downloadFile);

module.exports = router;

