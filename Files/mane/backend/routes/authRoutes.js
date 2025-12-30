/**
 * Authentication Routes
 * Handles all authentication related endpoints
 */

const express = require('express');
const router = express.Router();
const { login, register, collegeLogin, logout, getMe, changePassword } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

// Public routes
router.post('/login', login);
router.post('/register', register);
router.post('/college/login', collegeLogin);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/change-password', protect, changePassword);

module.exports = router;

