/**
 * Error Handling Middleware
 * Centralized error handling for the application
 */

/**
 * Not Found Handler
 * Handles 404 errors for undefined routes
 */
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

/**
 * Global Error Handler
 * Handles all errors in the application
 */
const errorHandler = (err, req, res, next) => {
    // Log error for debugging
    console.error('Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        url: req.originalUrl,
        method: req.method
    });

    // Set status code
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    // Handle specific error types
    let message = err.message;

    // MongoDB duplicate key error
    if (err.code === 11000) {
        message = 'Duplicate field value entered';
        res.status(400);
    }

    // MongoDB validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        message = messages.join(', ');
        res.status(400);
    }

    // MongoDB CastError (invalid ObjectId)
    if (err.name === 'CastError') {
        message = `Resource not found with id: ${err.value}`;
        res.status(404);
    }

    // JWT errors are handled in authMiddleware

    res.status(statusCode).json({
        success: false,
        message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = {
    notFound,
    errorHandler
};

