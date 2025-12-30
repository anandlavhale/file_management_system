/**
 * Frontend Configuration
 * API endpoints and application settings
 */

const CONFIG = {
    // API Base URL - Backend is deployed on Render
    API_BASE_URL: 'https://file-management-system-1wuf.onrender.com/api',
    
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

