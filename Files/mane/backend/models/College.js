const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const CollegeSchema = new mongoose.Schema({
    collegeId: {
        type: String,
        required: [true, 'College ID is required'],
        unique: true,
        trim: true,
        minlength: [3, 'College ID must be at least 3 characters'],
        maxlength: [50, 'College ID cannot exceed 50 characters']
    },
    collegeName: {
        type: String,
        required: [true, 'College name is required'],
        trim: true,
        maxlength: [100, 'College name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    contactPerson: {
        type: String,
        trim: true,
        maxlength: [100, 'Contact person name cannot exceed 100 characters']
    },
    phone: {
        type: String,
        trim: true,
        maxlength: [20, 'Phone number cannot exceed 20 characters']
    },
    address: {
        type: String,
        trim: true,
        maxlength: [200, 'Address cannot exceed 200 characters']
    },
    city: {
        type: String,
        trim: true,
        maxlength: [50, 'City cannot exceed 50 characters']
    },
    state: {
        type: String,
        trim: true,
        maxlength: [50, 'State cannot exceed 50 characters']
    },
    pinCode: {
        type: String,
        trim: true,
        maxlength: [10, 'Pin code cannot exceed 10 characters']
    },
    role: {
        type: String,
        enum: ['admin', 'college'],
        default: 'college'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true
});

CollegeSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

CollegeSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

CollegeSchema.methods.updateLastLogin = async function() {
    this.lastLogin = new Date();
    await this.save({ validateBeforeSave: false });
};

CollegeSchema.statics.findByCollegeId = function(collegeId) {
    return this.findOne({ collegeId }).select('+password');
};

CollegeSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() }).select('+password');
};

module.exports = mongoose.model('College', CollegeSchema);
