/**
 * FileRecord Model
 * Defines the schema for file records in the file management system
 */

const mongoose = require('mongoose');
const path = require('path');

// Valid file type choices
const FILE_TYPE_CHOICES = ['PDF', 'DOCX', 'XLSX', 'Image', 'Other'];

const FileRecordSchema = new mongoose.Schema({
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    fileName: {
        type: String,
        required: [true, 'File name is required'],
        trim: true
    },
    originalName: {
        type: String,
        required: [true, 'Original file name is required'],
        trim: true
    },
    filePath: {
        type: String,
        required: [true, 'File path is required']
    },
    fileType: {
        type: String,
        enum: FILE_TYPE_CHOICES,
        default: 'Other'
    },
    fileSize: {
        type: Number,
        default: 0
    },
    mimeType: {
        type: String,
        trim: true
    },
    fileDate: {
        type: Date,
        default: null
    },
    letterReferenceNumber: {
        type: String,
        trim: true,
        maxlength: [255, 'Letter reference number cannot exceed 255 characters'],
        default: null
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    uploadDateTime: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // Automatically handles createdAt and updatedAt
});

// Pre-save middleware to determine file type based on extension
FileRecordSchema.pre('save', function(next) {
    if (this.fileName) {
        const ext = path.extname(this.fileName).toLowerCase();
        
        switch (ext) {
            case '.pdf':
                this.fileType = 'PDF';
                break;
            case '.docx':
            case '.doc':
                this.fileType = 'DOCX';
                break;
            case '.xlsx':
            case '.xls':
                this.fileType = 'XLSX';
                break;
            case '.jpg':
            case '.jpeg':
            case '.png':
            case '.gif':
            case '.bmp':
            case '.webp':
                this.fileType = 'Image';
                break;
            default:
                this.fileType = 'Other';
        }
    }
    next();
});

// Virtual for formatted file size
FileRecordSchema.virtual('fileSizeFormatted').get(function() {
    const bytes = this.fileSize;
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Index for faster queries
FileRecordSchema.index({ description: 'text' });
FileRecordSchema.index({ fileType: 1 });
FileRecordSchema.index({ uploadDateTime: -1 });
FileRecordSchema.index({ fileDate: 1 });
FileRecordSchema.index({ letterReferenceNumber: 1 });

// Static method to get file type choices
FileRecordSchema.statics.getFileTypeChoices = function() {
    return FILE_TYPE_CHOICES;
};

// Ensure virtuals are included in JSON output
FileRecordSchema.set('toJSON', { virtuals: true });
FileRecordSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('FileRecord', FileRecordSchema);