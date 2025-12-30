/**
 * API Service
 * Handles all HTTP requests to the backend
 */

const API = {
    /**
     * Get authentication token from storage
     */
    getToken() {
        return localStorage.getItem(CONFIG.TOKEN_KEY);
    },

    /**
     * Set authentication token
     */
    setToken(token) {
        localStorage.setItem(CONFIG.TOKEN_KEY, token);
    },

    /**
     * Remove authentication token
     */
    removeToken() {
        localStorage.removeItem(CONFIG.TOKEN_KEY);
        localStorage.removeItem(CONFIG.USER_KEY);
    },

    /**
     * Get stored user data
     */
    getUser() {
        const user = localStorage.getItem(CONFIG.USER_KEY);
        return user ? JSON.parse(user) : null;
    },

    /**
     * Set user data
     */
    setUser(user) {
        localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.getToken();
    },

    /**
     * Make API request
     */
    async request(endpoint, options = {}) {
        const url = `${CONFIG.API_BASE_URL}${endpoint}`;
        const token = this.getToken();

        const headers = {
            ...(options.headers || {})
        };

        // Add auth header if token exists
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Add content-type for JSON requests (not for FormData)
        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            // Handle unauthorized responses
            if (response.status === 401) {
                this.removeToken();
                if (window.location.pathname !== '/') {
                    window.location.reload();
                }
            }

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    /**
     * Auth endpoints
     */
    auth: {
        async login(userId, password) {
            const data = await API.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ userId, password })
            });
            
            if (data.success) {
                API.setToken(data.data.token);
                API.setUser(data.data.user);
            }
            
            return data;
        },

        async register(collegeData) {
            const data = await API.request('/auth/register', {
                method: 'POST',
                body: JSON.stringify(collegeData)
            });
            
            if (data.success) {
                API.setToken(data.data.token);
                API.setUser(data.data.college);
            }
            
            return data;
        },

        async collegeLogin(loginData) {
            const data = await API.request('/auth/college/login', {
                method: 'POST',
                body: JSON.stringify(loginData)
            });
            
            if (data.success) {
                API.setToken(data.data.token);
                API.setUser(data.data.college);
            }
            
            return data;
        },

        async logout() {
            try {
                await API.request('/auth/logout', { method: 'POST' });
            } finally {
                API.removeToken();
            }
        },

        async getMe() {
            return API.request('/auth/me');
        },

        async changePassword(currentPassword, newPassword) {
            return API.request('/auth/change-password', {
                method: 'PUT',
                body: JSON.stringify({ currentPassword, newPassword })
            });
        }
    },

    /**
     * File endpoints
     */
    files: {
        async getAll(params = {}) {
            const query = new URLSearchParams(params).toString();
            return API.request(`/files${query ? '?' + query : ''}`);
        },

        async getOne(id) {
            return API.request(`/files/${id}`);
        },

        async create(formData) {
            return API.request('/files', {
                method: 'POST',
                body: formData
            });
        },

        async update(id, formData) {
            return API.request(`/files/${id}`, {
                method: 'PUT',
                body: formData
            });
        },

        async delete(id) {
            return API.request(`/files/${id}`, {
                method: 'DELETE'
            });
        },

        getDownloadUrl(id) {
            return `${CONFIG.API_BASE_URL}/files/${id}/download`;
        },

        async download(id) {
            const token = API.getToken();
            const url = this.getDownloadUrl(id);
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Download failed');
            }

            const blob = await response.blob();
            const contentDisposition = response.headers.get('content-disposition');
            let filename = 'download';
            
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?([^"]+)"?/);
                if (match) filename = match[1];
            }

            // Create download link
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        },

        async exportToExcel(params = {}) {
            const token = API.getToken();
            const query = new URLSearchParams(params).toString();
            const url = `${CONFIG.API_BASE_URL}/files/export${query ? '?' + query : ''}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Export failed');
            }

            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'file_records_export.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        },

        async getStats() {
            return API.request('/files/stats');
        }
    }
};