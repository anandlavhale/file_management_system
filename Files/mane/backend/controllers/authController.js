/**
 * Authentication Controller
 * Handles user login, logout, and authentication related operations
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const College = require('../models/College');

/**
 * Generate JWT Token
 * @param {string} userId - User's MongoDB _id
 * @returns {string} JWT token
 */
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
    try {
        const { userId, password } = req.body;

        // Validate input
        if (!userId || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide user ID and password'
            });
        }

        // Find user by userId and include password field
        const user = await User.findByUserId(userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated. Please contact administrator.'
            });
        }

        // Compare password using bcrypt
        const isPasswordMatch = await user.comparePassword(password);

        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Update last login time
        await user.updateLastLogin();

        // Generate JWT token
        const token = generateToken(user._id);

        // Send response
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user._id,
                    userId: user.userId,
                    name: user.name,
                    role: user.role,
                    lastLogin: user.lastLogin
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Register new college
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
    try {
        const { 
            collegeId, 
            collegeName, 
            email, 
            password, 
            contactPerson,
            phone,
            address,
            city,
            state,
            pinCode
        } = req.body;

        if (!collegeId || !collegeName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide collegeId, collegeName, email, and password'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        let college = await College.findOne({ 
            $or: [{ collegeId }, { email: email.toLowerCase() }]
        });

        if (college) {
            return res.status(400).json({
                success: false,
                message: 'College ID or email already registered'
            });
        }

        college = new College({
            collegeId,
            collegeName,
            email: email.toLowerCase(),
            password,
            contactPerson: contactPerson || '',
            phone: phone || '',
            address: address || '',
            city: city || '',
            state: state || '',
            pinCode: pinCode || '',
            role: 'college',
            isActive: true,
            isApproved: false
        });

        await college.save();

        const token = generateToken(college._id);

        res.status(201).json({
            success: true,
            message: 'College registered successfully. Please wait for approval.',
            data: {
                token,
                college: {
                    id: college._id,
                    collegeId: college.collegeId,
                    collegeName: college.collegeName,
                    email: college.email,
                    isApproved: college.isApproved
                }
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Login college
 * @route   POST /api/auth/college/login
 * @access  Public
 */
const collegeLogin = async (req, res) => {
    try {
        const { collegeId, email, password } = req.body;

        if (!password || (!collegeId && !email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide (collegeId or email) and password'
            });
        }

        let college;
        if (collegeId) {
            college = await College.findOne({ collegeId }).select('+password');
        } else {
            college = await College.findByEmail(email);
        }

        if (!college) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        if (!college.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated. Please contact administrator.'
            });
        }

        if (!college.isApproved) {
            return res.status(403).json({
                success: false,
                message: 'Your college registration is pending approval. Please wait for admin confirmation.'
            });
        }

        const isPasswordMatch = await college.comparePassword(password);

        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        await college.updateLastLogin();

        const token = generateToken(college._id);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                college: {
                    id: college._id,
                    collegeId: college.collegeId,
                    collegeName: college.collegeName,
                    email: college.email,
                    role: college.role,
                    isApproved: college.isApproved,
                    lastLogin: college.lastLogin
                }
            }
        });

    } catch (error) {
        console.error('College login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                userId: user.userId,
                name: user.name,
                role: user.role,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Logout user (client-side token removal)
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res) => {
    // JWT tokens are stateless, so logout is handled client-side
    // This endpoint just confirms successful logout
    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
};

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current and new password'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters'
            });
        }

        // Get user with password
        const user = await User.findById(req.user.id).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password (will be hashed by pre-save middleware)
        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    login,
    register,
    collegeLogin,
    logout,
    getMe,
    changePassword
};

