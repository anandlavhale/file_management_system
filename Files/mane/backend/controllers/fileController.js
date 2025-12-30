/**
 * File Controller
 * Handles all file record CRUD operations, search, filtering, and export
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const ExcelJS = require('exceljs');
const FileRecord = require('../models/FileRecord');

/**
 * @desc    Get all file records with search, filter, and pagination
 * @route   GET /api/files
 * @access  Private
 */
const getFileRecords = async (req, res) => {
    try {
        const {
            search,
            fileType,
            startDate,
            endDate,
            sortBy = 'uploadDateTime',
            sortOrder = 'desc',
            page = 1,
            limit = 10
        } = req.query;

        // Build query
        let query = {};

        // Search by description (case-insensitive)
        if (search) {
            query.description = { $regex: search, $options: 'i' };
        }

        // Filter by file type
        if (fileType && fileType !== 'All') {
            query.fileType = fileType;
        }

        // Filter by date range
        if (startDate || endDate) {
            query.uploadDateTime = {};
            if (startDate) {
                query.uploadDateTime.$gte = new Date(startDate);
            }
            if (endDate) {
                // Set to end of day
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.uploadDateTime.$lte = end;
            }
        }

        // Build sort object
        const sortOptions = {};
        const validSortFields = ['uploadDateTime', 'description', 'fileType', 'fileDate'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'uploadDateTime';
        sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1;

        // Pagination
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;
        const skip = (pageNum - 1) * limitNum;

        // Execute query
        const [records, totalCount] = await Promise.all([
            FileRecord.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum)
                .populate('uploadedBy', 'userId name'),
            FileRecord.countDocuments(query)
        ]);

        // Calculate pagination info
        const totalPages = Math.ceil(totalCount / limitNum);

        res.status(200).json({
            success: true,
            data: {
                records,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalRecords: totalCount,
                    recordsPerPage: limitNum,
                    hasNextPage: pageNum < totalPages,
                    hasPrevPage: pageNum > 1
                },
                fileTypes: FileRecord.getFileTypeChoices()
            }
        });

    } catch (error) {
        console.error('Get file records error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching file records',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Get single file record
 * @route   GET /api/files/:id
 * @access  Private
 */
const getFileRecord = async (req, res) => {
    try {
        const record = await FileRecord.findById(req.params.id)
            .populate('uploadedBy', 'userId name');

        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'File record not found'
            });
        }

        res.status(200).json({
            success: true,
            data: record
        });

    } catch (error) {
        console.error('Get file record error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching file record',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Upload new file record
 * @route   POST /api/files
 * @access  Private
 */
const createFileRecord = async (req, res) => {
    try {
        const { description, fileDate, letterReferenceNumber } = req.body;

        // Validate required fields
        if (!description || !description.trim()) {
            // Remove uploaded file if validation fails
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({
                success: false,
                message: 'Description is required'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a file'
            });
        }

        // Create file record
        const fileRecord = new FileRecord({
            description: description.trim(),
            fileName: req.file.filename,
            originalName: req.file.originalname,
            filePath: req.file.path,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            fileDate: fileDate || null,
            letterReferenceNumber: letterReferenceNumber || null,
            uploadedBy: req.user.id
        });

        await fileRecord.save();

        // Emit real-time event to all connected clients
        const io = req.app.get('io');
        if (io) {
            io.emit('file:created', {
                action: 'created',
                record: fileRecord,
                message: 'New file uploaded'
            });
        }

        res.status(201).json({
            success: true,
            message: 'File uploaded successfully',
            data: fileRecord
        });

    } catch (error) {
        console.error('Create file record error:', error);
        // Clean up uploaded file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
            success: false,
            message: 'Error uploading file',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Update file record
 * @route   PUT /api/files/:id
 * @access  Private
 */
const updateFileRecord = async (req, res) => {
    try {
        const { description, fileDate, letterReferenceNumber } = req.body;

        let record = await FileRecord.findById(req.params.id);

        if (!record) {
            // Remove uploaded file if record not found
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(404).json({
                success: false,
                message: 'File record not found'
            });
        }

        // Update fields
        if (description) {
            record.description = description.trim();
        }

        if (fileDate !== undefined) {
            record.fileDate = fileDate || null;
        }

        if (letterReferenceNumber !== undefined) {
            record.letterReferenceNumber = letterReferenceNumber || null;
        }

        // If new file is uploaded, replace old file
        if (req.file) {
            // Delete old file
            if (record.filePath && fs.existsSync(record.filePath)) {
                fs.unlinkSync(record.filePath);
            }

            // Update file info
            record.fileName = req.file.filename;
            record.originalName = req.file.originalname;
            record.filePath = req.file.path;
            record.fileSize = req.file.size;
            record.mimeType = req.file.mimetype;
        }

        await record.save();

        // Emit real-time event to all connected clients
        const io = req.app.get('io');
        if (io) {
            io.emit('file:updated', {
                action: 'updated',
                record: record,
                message: 'File record updated'
            });
        }

        res.status(200).json({
            success: true,
            message: 'File record updated successfully',
            data: record
        });

    } catch (error) {
        console.error('Update file record error:', error);
        // Clean up uploaded file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
            success: false,
            message: 'Error updating file record',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Delete file record
 * @route   DELETE /api/files/:id
 * @access  Private
 */
const deleteFileRecord = async (req, res) => {
    try {
        const record = await FileRecord.findById(req.params.id);

        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'File record not found'
            });
        }

        // Delete physical file
        if (record.filePath && fs.existsSync(record.filePath)) {
            fs.unlinkSync(record.filePath);
        }

        // Store record id before deletion
        const deletedId = req.params.id;

        // Delete record from database
        await FileRecord.findByIdAndDelete(req.params.id);

        // Emit real-time event to all connected clients
        const io = req.app.get('io');
        if (io) {
            io.emit('file:deleted', {
                action: 'deleted',
                recordId: deletedId,
                message: 'File record deleted'
            });
        }

        res.status(200).json({
            success: true,
            message: 'File record deleted successfully'
        });

    } catch (error) {
        console.error('Delete file record error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting file record',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Download file
 * @route   GET /api/files/:id/download
 * @access  Private
 */
const downloadFile = async (req, res) => {
    try {
        const record = await FileRecord.findById(req.params.id);

        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'File record not found'
            });
        }

        if (!record.filePath || !fs.existsSync(record.filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File not found on server'
            });
        }

        // Send file for download
        res.download(record.filePath, record.originalName);

    } catch (error) {
        console.error('Download file error:', error);
        res.status(500).json({
            success: false,
            message: 'Error downloading file',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Export records to Excel with files in ZIP
 * @route   GET /api/files/export
 * @access  Private
 */
const exportToExcel = async (req, res) => {
    try {
        const { search, fileType, startDate, endDate, sortBy = 'uploadDateTime', sortOrder = 'desc' } = req.query;

        // Build query (same as getFileRecords)
        let query = {};

        if (search) {
            query.description = { $regex: search, $options: 'i' };
        }

        if (fileType && fileType !== 'All') {
            query.fileType = fileType;
        }

        if (startDate || endDate) {
            query.uploadDateTime = {};
            if (startDate) {
                query.uploadDateTime.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.uploadDateTime.$lte = end;
            }
        }

        // Sort options
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Get all matching records (no pagination for export)
        const records = await FileRecord.find(query).sort(sortOptions);

        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'File Management System';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet('File Records');

        // Define columns
        worksheet.columns = [
            { header: 'Serial Number', key: 'id', width: 15 },
            { header: 'Description', key: 'description', width: 30 },
            { header: 'File Date', key: 'fileDate', width: 15 },
            { header: 'Letter Reference', key: 'letterRef', width: 20 },
            { header: 'File Name', key: 'fileName', width: 25 },
            { header: 'File Type', key: 'fileType', width: 12 },
            { header: 'Upload Date & Time', key: 'uploadDateTime', width: 22 }
        ];

        // Style header row
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };
        worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

        // Add data rows
        records.forEach((record, index) => {
            worksheet.addRow({
                id: index + 1,
                description: record.description,
                fileDate: record.fileDate ? record.fileDate.toISOString().split('T')[0] : '—',
                letterRef: record.letterReferenceNumber || '—',
                fileName: record.originalName,
                fileType: record.fileType,
                uploadDateTime: record.uploadDateTime.toISOString().replace('T', ' ').substring(0, 19)
            });
        });

        // Style data rows
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                row.alignment = { vertical: 'middle' };
                row.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            }
        });

        // Create ZIP archive with Excel and files
        const archive = archiver('zip', { zlib: { level: 9 } });

        // Set response headers for ZIP download
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename=file_records_export.zip');

        // Pipe archive to response
        archive.pipe(res);

        // Add Excel file to archive
        const excelBuffer = await workbook.xlsx.writeBuffer();
        archive.append(excelBuffer, { name: 'records.xlsx' });

        // Add actual files to archive
        for (let i = 0; i < records.length; i++) {
            const record = records[i];
            if (record.filePath && fs.existsSync(record.filePath)) {
                const ext = path.extname(record.originalName);
                const nameWithoutExt = path.basename(record.originalName, ext);
                const uniqueFilename = `${String(i + 1).padStart(3, '0')}_${nameWithoutExt}${ext}`;
                archive.file(record.filePath, { name: `files/${uniqueFilename}` });
            }
        }

        // Finalize archive
        await archive.finalize();

    } catch (error) {
        console.error('Export to Excel error:', error);
        res.status(500).json({
            success: false,
            message: 'Error exporting records',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Get file type statistics
 * @route   GET /api/files/stats
 * @access  Private
 */
const getStats = async (req, res) => {
    try {
        const stats = await FileRecord.aggregate([
            {
                $group: {
                    _id: '$fileType',
                    count: { $sum: 1 },
                    totalSize: { $sum: '$fileSize' }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        const totalRecords = await FileRecord.countDocuments();
        const totalSize = stats.reduce((acc, s) => acc + s.totalSize, 0);

        res.status(200).json({
            success: true,
            data: {
                totalRecords,
                totalSize,
                byFileType: stats
            }
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    getFileRecords,
    getFileRecord,
    createFileRecord,
    updateFileRecord,
    deleteFileRecord,
    downloadFile,
    exportToExcel,
    getStats
};

