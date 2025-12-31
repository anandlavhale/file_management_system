/**
 * Server Entry Point
 * Main application file for the File Management System API
 * With Real-time WebSocket support using Socket.io
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

// Load environment variables
require('dotenv').config();

// Import database connection
const connectDB = require('./config/db');

// Import routes
const { authRoutes, fileRoutes } = require('./routes');

// Import middlewares
const { notFound, errorHandler } = require('./middlewares');

// Initialize express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io with CORS
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Make io accessible to routes/controllers
app.set('io', io);

// Connect to MongoDB
connectDB();

// Middleware
// Enable CORS for frontend
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:5000'
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Logging in development
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'File Management System API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        realtime: true,
        connectedClients: io.engine.clientsCount
    });
});

// API info endpoint
app.get('/api', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to File Management System API',
        version: '1.0.0',
        features: {
            realtime: 'WebSocket support enabled for live updates'
        },
        endpoints: {
            auth: {
                login: 'POST /api/auth/login',
                logout: 'POST /api/auth/logout',
                me: 'GET /api/auth/me',
                changePassword: 'PUT /api/auth/change-password'
            },
            files: {
                list: 'GET /api/files',
                get: 'GET /api/files/:id',
                create: 'POST /api/files',
                update: 'PUT /api/files/:id',
                delete: 'DELETE /api/files/:id',
                download: 'GET /api/files/:id/download',
                export: 'GET /api/files/export',
                stats: 'GET /api/files/stats'
            }
        }
    });
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);
    
    // Join a room based on user (optional - for user-specific updates)
    socket.on('join', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`👤 User ${userId} joined their room`);
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
    });
});

// Error handling middlewares
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   🗂️  FILE MANAGEMENT SYSTEM - MANE STACK');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`   🌐 Port: ${PORT}`);
    console.log(`   📡 API: http://localhost:${PORT}/api`);
    console.log(`   🔌 WebSocket: Real-time updates enabled`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.error('❌ Unhandled Rejection:', err.message);
    // Close server & exit process
    server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err.message);
    process.exit(1);
});

module.exports = { app, io };
