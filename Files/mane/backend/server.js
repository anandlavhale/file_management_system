/**
 * Server Entry Point
 * File Management System API
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

require('dotenv').config();

const connectDB = require('./config/db');
const { authRoutes, fileRoutes } = require('./routes');
const { notFound, errorHandler } = require('./middlewares');

const app = express();
const server = http.createServer(app);

/* =======================
   SOCKET.IO
======================= */
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

app.set('io', io);

/* =======================
   DATABASE
======================= */
connectDB();

/* =======================
   CORS (🔥 FIXED)
======================= */
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:5000'
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // allow Postman, curl, server-to-server
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 🔥 IMPORTANT: allow preflight requests
app.options('*', cors());

/* =======================
   BODY PARSERS
======================= */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

/* =======================
   STATIC FILES
======================= */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* =======================
   API ROUTES
======================= */
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

/* =======================
   HEALTH
======================= */
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

/* =======================
   SOCKET EVENTS
======================= */
io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('join', (userId) => {
        socket.join(`user_${userId}`);
    });

    socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
    });
});

/* =======================
   ERRORS
======================= */
app.use(notFound);
app.use(errorHandler);

/* =======================
   SERVER
======================= */
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

/* =======================
   PROCESS SAFETY
======================= */
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err.message);
    server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err.message);
    process.exit(1);
});

module.exports = { app, io };
