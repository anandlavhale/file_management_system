/**
 * Frontend Configuration
 * API endpoints and application settings
 */

const getBaseUrls = () => {
    const hostname = window.location.hostname;
    const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1';

    if (isDevelopment) {
        return {
            API: 'http://localhost:5000/api',
            SOCKET: 'http://localhost:5000'
        };
    }

    return {
        API: 'https://file-management-system-1wuf.onrender.com/api',
        SOCKET: 'https://file-management-system-1wuf.onrender.com'
    };
};

const BASE_URLS = getBaseUrls();

const CONFIG = {
    // REST API base URL
    API_BASE_URL: BASE_URLS.API,

    // WebSocket base URL (NO /api)
    SOCKET_URL: BASE_URLS.SOCKET,

    // Storage keys
    TOKEN_KEY: 'fms_token',
    USER_KEY: 'fms_user',

    // File type choices
    FILE_TYPES: ['PDF', 'DOCX', 'XLSX', 'Image', 'Other'],

    // Pagination
    DEFAULT_PAGE_SIZE: 10,

    // File size limit (10MB)
    MAX_FILE_SIZE: 10 * 1024 * 1024
};

Object.freeze(CONFIG);
