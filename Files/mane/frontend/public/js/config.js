/**
 * Frontend Configuration
 * API endpoints and application settings
 */

const getApiBaseUrl = () => {
    const hostname = window.location.hostname;
    const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1';
    
    if (isDevelopment) {
        return 'http://localhost:5000/api';
    }
    
    return 'https://file-management-system-1wuf.onrender.com/api';
};

const CONFIG = {
    // API Base URL - automatically detect development vs production
    API_BASE_URL: getApiBaseUrl(),
    
    // Token storage key
    TOKEN_KEY: 'fms_token',
    USER_KEY: 'fms_user',
    
    // File type choices
    FILE_TYPES: ['PDF', 'DOCX', 'XLSX', 'Image', 'Other'],
    
    // Pagination
    DEFAULT_PAGE_SIZE: 10,
    
    // File size limit (10MB)
    MAX_FILE_SIZE: 10 * 1024 * 1024
};

// Freeze config to prevent modifications
Object.freeze(CONFIG);

