const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GridFS bucket instance
let bucket;

// Initialize GridFS bucket after MongoDB connection
const initGridFS = () => {
    const db = mongoose.connection.db;
    bucket = new GridFSBucket(db, {
        bucketName: 'jtmobamba_user_files'
    });
    console.log('GridFS bucket initialized');
};

// Wait for MongoDB connection
mongoose.connection.once('open', () => {
    initGridFS();
});

// Multer storage configuration (memory storage for GridFS)
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: Infinity // No file size limit
    },
    fileFilter: (req, file, cb) => {
        // Allow most common file types
        const blockedTypes = [
            'application/x-executable',
            'application/x-msdownload'
        ];

        if (blockedTypes.includes(file.mimetype)) {
            cb(new Error('File type not allowed'), false);
        } else {
            cb(null, true);
        }
    }
});

// Upload single file
router.post('/upload', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        if (!bucket) {
            return res.status(500).json({ error: 'Storage not initialized' });
        }

        const { originalname, mimetype, buffer, size } = req.file;

        // Create upload stream to GridFS
        const uploadStream = bucket.openUploadStream(originalname, {
            contentType: mimetype,
            metadata: {
                uploadedBy: req.user._id,
                uploadDate: new Date(),
                originalName: originalname,
                size: size
            }
        });

        // Write buffer to GridFS
        uploadStream.end(buffer);

        // Wait for upload to complete
        uploadStream.on('finish', () => {
            res.status(201).json({
                message: 'File uploaded successfully',
                file: {
                    id: uploadStream.id,
                    filename: originalname,
                    contentType: mimetype,
                    size: size,
                    url: `/api/files/${uploadStream.id}`
                }
            });
        });

        uploadStream.on('error', (error) => {
            console.error('Upload error:', error);
            res.status(500).json({ error: 'Upload failed' });
        });

    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// Upload multiple files
router.post('/upload-multiple', auth, upload.array('files', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        if (!bucket) {
            return res.status(500).json({ error: 'Storage not initialized' });
        }

        const uploadPromises = req.files.map(file => {
            return new Promise((resolve, reject) => {
                const uploadStream = bucket.openUploadStream(file.originalname, {
                    contentType: file.mimetype,
                    metadata: {
                        uploadedBy: req.user._id,
                        uploadDate: new Date(),
                        originalName: file.originalname,
                        size: file.size
                    }
                });

                uploadStream.end(file.buffer);

                uploadStream.on('finish', () => {
                    resolve({
                        id: uploadStream.id,
                        filename: file.originalname,
                        contentType: file.mimetype,
                        size: file.size,
                        url: `/api/files/${uploadStream.id}`
                    });
                });

                uploadStream.on('error', reject);
            });
        });

        const uploadedFiles = await Promise.all(uploadPromises);

        res.status(201).json({
            message: 'Files uploaded successfully',
            files: uploadedFiles
        });

    } catch (error) {
        console.error('Multiple file upload error:', error);
        res.status(500).json({ error: 'Failed to upload files' });
    }
});

// List user's files (MUST be before /:id route)
router.get('/list', auth, async (req, res) => {
    try {
        if (!bucket) {
            return res.status(500).json({ error: 'Storage not initialized' });
        }

        const { page = 1, limit = 50 } = req.query;

        // Find files uploaded by this user
        const files = await bucket.find({ 'metadata.uploadedBy': req.user._id })
            .sort({ uploadDate: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .toArray();

        const allUserFiles = await bucket.find({ 'metadata.uploadedBy': req.user._id }).toArray();
        const totalSize = allUserFiles.reduce((sum, file) => sum + file.length, 0);

        res.json({
            files: files.map(file => ({
                _id: file._id,
                filename: file.filename,
                contentType: file.contentType,
                length: file.length,
                uploadDate: file.uploadDate,
                url: `/api/files/${file._id}`
            })),
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: allUserFiles.length
            },
            totalSize
        });

    } catch (error) {
        console.error('List user files error:', error);
        res.status(500).json({ error: 'Failed to list files' });
    }
});

// Storage stats (MUST be before /:id route)
router.get('/storage/stats', auth, async (req, res) => {
    try {
        if (!bucket) {
            return res.status(500).json({ error: 'Storage not initialized' });
        }

        const files = await bucket.find({ 'metadata.uploadedBy': req.user._id }).toArray();

        const totalSize = files.reduce((sum, file) => sum + file.length, 0);
        const storageLimit = 8 * 1024 * 1024 * 1024; // 8GB

        res.json({
            fileCount: files.length,
            totalSize: totalSize,
            storageLimit: storageLimit,
            usagePercentage: ((totalSize / storageLimit) * 100).toFixed(2)
        });

    } catch (error) {
        console.error('Get storage stats error:', error);
        res.status(500).json({ error: 'Failed to get storage stats' });
    }
});

// Get file by ID
router.get('/:id', async (req, res) => {
    try {
        if (!bucket) {
            return res.status(500).json({ error: 'Storage not initialized' });
        }

        const fileId = new mongoose.Types.ObjectId(req.params.id);

        // Find file metadata
        const files = await bucket.find({ _id: fileId }).toArray();

        if (!files || files.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        const file = files[0];

        // Set headers
        res.set('Content-Type', file.contentType);
        res.set('Content-Disposition', `inline; filename="${file.filename}"`);

        // Stream file to response
        const downloadStream = bucket.openDownloadStream(fileId);
        downloadStream.pipe(res);

        downloadStream.on('error', (error) => {
            console.error('Download error:', error);
            res.status(500).json({ error: 'Failed to download file' });
        });

    } catch (error) {
        console.error('Get file error:', error);
        res.status(500).json({ error: 'Failed to get file' });
    }
});

// Download file with original filename
router.get('/:id/download', async (req, res) => {
    try {
        if (!bucket) {
            return res.status(500).json({ error: 'Storage not initialized' });
        }

        const fileId = new mongoose.Types.ObjectId(req.params.id);

        const files = await bucket.find({ _id: fileId }).toArray();

        if (!files || files.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        const file = files[0];

        res.set('Content-Type', file.contentType);
        res.set('Content-Disposition', `attachment; filename="${file.filename}"`);

        const downloadStream = bucket.openDownloadStream(fileId);
        downloadStream.pipe(res);

    } catch (error) {
        console.error('Download file error:', error);
        res.status(500).json({ error: 'Failed to download file' });
    }
});

// Get file info
router.get('/:id/info', async (req, res) => {
    try {
        if (!bucket) {
            return res.status(500).json({ error: 'Storage not initialized' });
        }

        const fileId = new mongoose.Types.ObjectId(req.params.id);

        const files = await bucket.find({ _id: fileId }).toArray();

        if (!files || files.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        const file = files[0];

        res.json({
            id: file._id,
            filename: file.filename,
            contentType: file.contentType,
            size: file.length,
            uploadDate: file.uploadDate,
            metadata: file.metadata
        });

    } catch (error) {
        console.error('Get file info error:', error);
        res.status(500).json({ error: 'Failed to get file info' });
    }
});

// List all files (admin only)
router.get('/', auth, adminOnly, async (req, res) => {
    try {
        if (!bucket) {
            return res.status(500).json({ error: 'Storage not initialized' });
        }

        const { page = 1, limit = 20 } = req.query;

        const files = await bucket.find({})
            .sort({ uploadDate: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .toArray();

        // Get total count
        const totalFiles = await bucket.find({}).toArray();

        // Calculate storage used
        const storageUsed = totalFiles.reduce((sum, file) => sum + file.length, 0);

        res.json({
            files: files.map(file => ({
                id: file._id,
                filename: file.filename,
                contentType: file.contentType,
                size: file.length,
                uploadDate: file.uploadDate,
                url: `/api/files/${file._id}`
            })),
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: totalFiles.length,
                pages: Math.ceil(totalFiles.length / Number(limit))
            },
            storage: {
                used: storageUsed,
                usedFormatted: formatBytes(storageUsed),
                limit: 8 * 1024 * 1024 * 1024, // 8GB
                limitFormatted: '8 GB',
                percentage: ((storageUsed / (8 * 1024 * 1024 * 1024)) * 100).toFixed(2)
            }
        });

    } catch (error) {
        console.error('List files error:', error);
        res.status(500).json({ error: 'Failed to list files' });
    }
});

// Delete file (owner or admin)
router.delete('/:id', auth, async (req, res) => {
    try {
        if (!bucket) {
            return res.status(500).json({ error: 'Storage not initialized' });
        }

        const fileId = new mongoose.Types.ObjectId(req.params.id);

        // Find the file to check ownership
        const files = await bucket.find({ _id: fileId }).toArray();
        if (!files || files.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        const file = files[0];

        // Check if user owns the file or is admin
        const isOwner = file.metadata?.uploadedBy?.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: 'Not authorized to delete this file' });
        }

        await bucket.delete(fileId);

        res.json({ message: 'File deleted successfully' });

    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

// Helper function to format bytes
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = router;
