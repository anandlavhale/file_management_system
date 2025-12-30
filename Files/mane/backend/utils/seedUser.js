/**
 * Seed User Utility
 * Creates the default user from environment variables
 * Password is hashed using bcrypt (handled by User model)
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const connectDB = require('../config/db');

/**
 * Seed default user
 * Creates user with credentials from .env file
 */
const seedDefaultUser = async () => {
    try {
        // Connect to database
        await connectDB();

        // Get credentials from environment variables
        const userId = process.env.DEFAULT_USER_ID;
        const password = process.env.DEFAULT_USER_PASSWORD;

        if (!userId || !password) {
            console.error('❌ DEFAULT_USER_ID and DEFAULT_USER_PASSWORD must be set in .env file');
            process.exit(1);
        }

        // Check if user already exists
        const existingUser = await User.findOne({ userId });

        if (existingUser) {
            console.log(`ℹ️ User '${userId}' already exists in database`);
            console.log('   To reset password, delete the user first or use change-password feature');
            process.exit(0);
        }

        // Create new user (password will be hashed by pre-save middleware)
        const user = await User.create({
            userId: userId,
            password: password,
            name: 'Default Admin',
            role: 'admin',
            isActive: true
        });

        console.log('✅ Default user created successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`   User ID: ${user.userId}`);
        console.log(`   Role: ${user.role}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('⚠️  Password has been hashed and stored securely');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding user:', error.message);
        process.exit(1);
    }
};

/**
 * Delete default user (for testing/reset purposes)
 */
const deleteDefaultUser = async () => {
    try {
        await connectDB();

        const userId = process.env.DEFAULT_USER_ID;

        if (!userId) {
            console.error('❌ DEFAULT_USER_ID must be set in .env file');
            process.exit(1);
        }

        const result = await User.deleteOne({ userId });

        if (result.deletedCount > 0) {
            console.log(`✅ User '${userId}' deleted successfully`);
        } else {
            console.log(`ℹ️ User '${userId}' not found in database`);
        }

        process.exit(0);

    } catch (error) {
        console.error('❌ Error deleting user:', error.message);
        process.exit(1);
    }
};

// Run based on command line argument
const action = process.argv[2];

if (action === 'delete') {
    deleteDefaultUser();
} else {
    seedDefaultUser();
}

module.exports = { seedDefaultUser, deleteDefaultUser };

