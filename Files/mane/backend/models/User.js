/**
 * User Model
 * Defines the schema for user authentication
 * Passwords are hashed using bcrypt
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: [true, 'User ID is required'],
        unique: true,
        trim: true,
        minlength: [3, 'User ID must be at least 3 characters'],
        maxlength: [50, 'User ID cannot exceed 50 characters']
    },
    email: {
        type: String,
        unique: true,
        sparse: true, // Allow null/missing values to not conflict
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Don't return password by default in queries
    },
    name: {
        type: String,
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true // Automatically handles createdAt and updatedAt
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
    // Only hash if password was modified
    if (!this.isModified('password')) {
        return next();
    }

    try {
        // Generate salt with 12 rounds
        const salt = await bcrypt.genSalt(12);
        // Hash password
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password for login
UserSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

// Method to update last login
UserSchema.methods.updateLastLogin = async function() {
    this.lastLogin = new Date();
    await this.save({ validateBeforeSave: false });
};

// Static method to find user by userId
UserSchema.statics.findByUserId = function(userId) {
    return this.findOne({ userId }).select('+password');
};

// Note: Index on userId is already created by 'unique: true' constraint

module.exports = mongoose.model('User', UserSchema);
