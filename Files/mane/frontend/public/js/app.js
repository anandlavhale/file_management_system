/**
 * File Management System - Main Application
 * Vanilla JavaScript frontend with React-friendly patterns
 */

// Application State
const App = {
    state: {
        isLoading: false,
        user: null,
        records: [],
        pagination: null,
        filters: {
            search: '',
            fileType: '',
            startDate: '',
            endDate: '',
            sortBy: 'uploadDateTime',
            sortOrder: 'desc',
            page: 1
        },
        editingRecord: null,
        message: null,
        theme: 'dark', // 'dark' or 'light'
        socket: null,   // Socket.io connection
        isConnected: false // WebSocket connection status
    },
    
    /**
     * Initialize theme from localStorage
     */
    initTheme() {
        const savedTheme = localStorage.getItem('fms_theme') || 'dark';
        this.state.theme = savedTheme;
        document.documentElement.setAttribute('data-theme', savedTheme);
    },
    
    /**
     * Toggle between dark and light theme
     */
    toggleTheme() {
        const newTheme = this.state.theme === 'dark' ? 'light' : 'dark';
        this.state.theme = newTheme;
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('fms_theme', newTheme);
        
        // Update toggle button text
        const toggleBtns = document.querySelectorAll('.theme-toggle, .login-theme-toggle');
        toggleBtns.forEach(btn => {
            btn.innerHTML = this.getThemeToggleContent();
        });
    },
    
    /**
     * Get theme toggle button content
     */
    getThemeToggleContent() {
        if (this.state.theme === 'dark') {
            return '<span class="theme-toggle-icon">🌙</span> Dark';
        } else {
            return '<span class="theme-toggle-icon">☀️</span> Light';
        }
    },

    /**
     * Initialize Socket.io connection for real-time updates
     */
    initSocket() {
        // Connect to Socket.io server
        const socketUrl = CONFIG.API_BASE_URL.replace('/api', '');
        this.state.socket = io(socketUrl, {
            transports: ['websocket', 'polling']
        });

        // Connection event handlers
        this.state.socket.on('connect', () => {
            this.state.isConnected = true;
            console.log('🔌 Real-time connection established');
            this.updateConnectionStatus();
        });

        this.state.socket.on('disconnect', () => {
            this.state.isConnected = false;
            console.log('❌ Real-time connection lost');
            this.updateConnectionStatus();
        });

        // File events - real-time updates
        this.state.socket.on('file:created', (data) => {
            console.log('📁 New file uploaded:', data);
            this.showMessage('info', `🔔 New file uploaded: ${data.record.originalName}`);
            this.loadRecords(); // Refresh records
        });

        this.state.socket.on('file:updated', (data) => {
            console.log('✏️ File updated:', data);
            this.showMessage('info', `🔔 File updated: ${data.record.originalName}`);
            this.loadRecords(); // Refresh records
        });

        this.state.socket.on('file:deleted', (data) => {
            console.log('🗑️ File deleted:', data);
            this.showMessage('info', '🔔 A file was deleted');
            this.loadRecords(); // Refresh records
        });
    },

    /**
     * Update connection status indicator
     */
    updateConnectionStatus() {
        const indicator = document.getElementById('connection-status');
        if (indicator) {
            if (this.state.isConnected) {
                indicator.innerHTML = '<span class="status-dot connected"></span> Live';
                indicator.title = 'Real-time updates active';
            } else {
                indicator.innerHTML = '<span class="status-dot disconnected"></span> Offline';
                indicator.title = 'Real-time updates disconnected';
            }
        }
    },

    /**
     * Initialize the application
     */
    init() {
        // Initialize theme first
        this.initTheme();
        
        // Initialize Socket.io for real-time updates
        this.initSocket();
        
        // DEMO MODE: Show main UI directly (bypass login for preview)
        const demoMode = false; // Set to false to enable login
        
        if (demoMode) {
            this.state.user = { userId: 'MESGCC', role: 'admin' };
            this.renderApp();
            this.renderDemoRecords(); // Show sample data
            return;
        }
        
        // Check authentication status
        if (API.isAuthenticated()) {
            this.state.user = API.getUser();
            this.renderApp();
            this.loadRecords();
        } else {
            this.renderLogin();
        }
    },
    
    /**
     * Render demo records for UI preview
     */
    renderDemoRecords() {
        // Sample demo data
        this.state.records = [
            { _id: '1', description: 'Annual Report 2024 - Financial Summary', fileDate: '2024-12-15', letterReferenceNumber: 'REF-001', originalName: 'annual_report_2024.pdf', fileType: 'PDF', uploadDateTime: '2024-12-20T10:30:00' },
            { _id: '2', description: 'Employee Training Manual - Updated Version', fileDate: '2024-12-10', letterReferenceNumber: 'REF-002', originalName: 'training_manual.docx', fileType: 'DOCX', uploadDateTime: '2024-12-18T14:45:00' },
            { _id: '3', description: 'Budget Spreadsheet Q4 2024', fileDate: '2024-12-01', letterReferenceNumber: 'REF-003', originalName: 'budget_q4_2024.xlsx', fileType: 'XLSX', uploadDateTime: '2024-12-15T09:15:00' },
            { _id: '4', description: 'Office Building Floor Plan', fileDate: '2024-11-20', letterReferenceNumber: null, originalName: 'floor_plan.png', fileType: 'Image', uploadDateTime: '2024-12-10T16:20:00' },
            { _id: '5', description: 'Meeting Minutes - December Board Meeting', fileDate: '2024-12-05', letterReferenceNumber: 'REF-005', originalName: 'meeting_minutes_dec.pdf', fileType: 'PDF', uploadDateTime: '2024-12-08T11:00:00' },
        ];
        this.state.pagination = {
            currentPage: 1,
            totalPages: 1,
            totalRecords: 5,
            recordsPerPage: 10,
            hasNextPage: false,
            hasPrevPage: false
        };
        this.renderRecords();
    },

    /**
     * Show loading overlay
     */
    showLoading(text = 'Loading...') {
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="spinner"></div>
            <div class="loading-text">${text}</div>
        `;
        document.body.appendChild(overlay);
    },

    /**
     * Hide loading overlay
     */
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.remove();
    },

    /**
     * Show alert message
     */
    showMessage(type, text) {
        const container = document.getElementById('message-container');
        if (!container) return;

        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `
            <span>${text}</span>
            <button class="alert-close" onclick="this.parentElement.remove()">&times;</button>
        `;
        container.appendChild(alert);

        // Auto-remove after 5 seconds
        setTimeout(() => alert.remove(), 5000);
    },

    /**
     * Render login page
     */
    renderLogin() {
        document.getElementById('root').innerHTML = `
            <div class="login-page">
                <button class="login-theme-toggle" onclick="App.toggleTheme()">
                    ${this.getThemeToggleContent()}
                </button>
                <div class="login-container">
                    <div class="login-box">
                        <div class="login-header">
                            <div class="login-logo">📁</div>
                            <h1 class="login-title">File Management System</h1>
                            <p class="login-subtitle">Admin & College Portal</p>
                        </div>
                        
                        <!-- Login Tab -->
                        <div id="login-tab" class="auth-tab-content active">
                            <div id="login-error"></div>
                            <form id="login-form" class="login-form">
                                <div class="form-group">
                                    <label for="userId">User ID</label>
                                    <input 
                                        type="text" 
                                        id="userId" 
                                        name="userId" 
                                        placeholder="Enter your User ID (e.g., MESGCC)"
                                        value="MESGCC"
                                        required
                                        autofocus
                                    >
                                </div>
                                
                                <div class="form-group">
                                    <label for="password">Password</label>
                                    <input 
                                        type="password" 
                                        id="password" 
                                        name="password" 
                                        placeholder="Enter your password"
                                        value="BBA@123"
                                        required
                                    >
                                </div>
                                
                                <button type="submit" class="btn-login">Sign In</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Attach event handlers
        document.getElementById('login-form').addEventListener('submit', this.handleLogin.bind(this));
    },
    
    /**
     * Switch between auth tabs
     */
    switchAuthTab(tab) {
        const loginTab = document.getElementById('login-tab');
        const registerTab = document.getElementById('register-tab');
        const tabBtns = document.querySelectorAll('.auth-tab-btn');
        
        tabBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tab) {
                btn.classList.add('active');
            }
        });
        
        if (tab === 'login') {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            document.getElementById('userId').focus();
        } else {
            registerTab.classList.add('active');
            loginTab.classList.remove('active');
            document.getElementById('collegeId').focus();
        }
    },

    /**
     * Handle login form submission
     */
    async handleLogin(e) {
        e.preventDefault();
        
        const userId = document.getElementById('userId').value.trim();
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('login-error');
        const submitBtn = e.target.querySelector('button[type="submit"]');

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing in...';
            errorDiv.innerHTML = '';

            const result = await API.auth.login(userId, password);

            if (result.success) {
                this.state.user = result.data.user;
                this.renderApp();
                this.loadRecords();
            }
        } catch (error) {
            errorDiv.innerHTML = `<div class="login-error">${error.message}</div>`;
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
        }
    },

    /**
     * Handle registration form submission
     */
    async handleRegister(e) {
        e.preventDefault();
        
        const collegeId = document.getElementById('collegeId').value.trim();
        const collegeName = document.getElementById('collegeName').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('regPassword').value;
        const contactPerson = document.getElementById('contactPerson').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const address = document.getElementById('address').value.trim();
        const city = document.getElementById('city').value.trim();
        const state = document.getElementById('state').value.trim();
        const pinCode = document.getElementById('pinCode').value.trim();
        const errorDiv = document.getElementById('register-error');
        const submitBtn = e.target.querySelector('button[type="submit"]');

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Registering...';
            errorDiv.innerHTML = '';

            const collegeData = {
                collegeId,
                collegeName,
                email,
                password,
                contactPerson: contactPerson || undefined,
                phone: phone || undefined,
                address: address || undefined,
                city: city || undefined,
                state: state || undefined,
                pinCode: pinCode || undefined
            };

            const result = await API.auth.register(collegeData);

            if (result.success) {
                errorDiv.innerHTML = `<div class="login-success">✓ ${result.message}</div>`;
                this.state.user = result.data.college;
                setTimeout(() => {
                    this.renderApp();
                    this.loadRecords();
                }, 2000);
            }
        } catch (error) {
            errorDiv.innerHTML = `<div class="login-error">${error.message}</div>`;
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Register College';
        }
    },

    /**
     * Handle logout
     */
    async handleLogout() {
        try {
            this.showLoading('Logging out...');
            await API.auth.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.hideLoading();
            this.state.user = null;
            this.renderLogin();
        }
    },

    /**
     * Render main application
     */
    renderApp() {
        const user = this.state.user;
        
        document.getElementById('root').innerHTML = `
            <div class="app-container">
                <header class="app-header">
                    <div class="header-brand">
                        <div class="header-logo">📁</div>
                        <div>
                            <h1 class="header-title">File Management System</h1>
                            <p class="header-subtitle">Manage your files efficiently</p>
                        </div>
                    </div>
                    <div class="header-user">
                        <div id="connection-status" class="connection-status" title="Real-time connection status">
                            <span class="status-dot ${this.state.isConnected ? 'connected' : 'disconnected'}"></span>
                            ${this.state.isConnected ? 'Live' : 'Connecting...'}
                        </div>
                        <button class="theme-toggle" onclick="App.toggleTheme()">
                            ${this.getThemeToggleContent()}
                        </button>
                        <div class="user-info">
                            <div class="user-name">${user?.userId || 'User'}</div>
                            <div class="user-role">${user?.role || 'user'}</div>
                        </div>
                        <button class="btn-logout" onclick="App.handleLogout()">Logout</button>
                    </div>
                </header>

                <main class="app-main">
                    <div id="message-container"></div>

                    <!-- Upload Section -->
                    <div class="card">
                        <div class="card-header">
                            <h2 class="card-title">Upload New File</h2>
                        </div>
                        <div class="card-body">
                            <form id="upload-form" class="upload-form">
                                <div class="form-group">
                                    <label for="description">Description <span class="required">*</span></label>
                                    <textarea 
                                        id="description" 
                                        class="form-textarea" 
                                        placeholder="Enter file description"
                                        required
                                    ></textarea>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="fileDate">File Date</label>
                                        <input type="date" id="fileDate" class="form-input">
                                    </div>
                                    <div class="form-group">
                                        <label for="letterRef">Letter Reference Number</label>
                                        <input 
                                            type="text" 
                                            id="letterRef" 
                                            class="form-input" 
                                            placeholder="Enter reference number"
                                        >
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label>Select File <span class="required">*</span></label>
                                    <div class="file-input-wrapper">
                                        <input type="file" id="file" class="file-input" required>
                                        <div class="file-input-display" onclick="document.getElementById('file').click()">
                                            <div class="file-input-icon">📄</div>
                                            <div class="file-input-text">Click to select a file or drag and drop</div>
                                            <div class="file-input-name" id="selected-file-name"></div>
                                        </div>
                                    </div>
                                </div>

                                <div class="form-actions">
                                    <button type="submit" class="btn btn-primary">Upload File</button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <!-- Filter Section -->
                    <div class="card">
                        <div class="card-header">
                            <h2 class="card-title">Search & Filter</h2>
                        </div>
                        <div class="card-body">
                            <form id="filter-form" class="filter-form">
                                <div class="form-group">
                                    <label for="search">Search Description</label>
                                    <input 
                                        type="text" 
                                        id="search" 
                                        class="form-input" 
                                        placeholder="Search..."
                                        value="${this.state.filters.search}"
                                    >
                                </div>
                                <div class="form-group">
                                    <label for="filterType">File Type</label>
                                    <select id="filterType" class="form-select">
                                        <option value="">All Types</option>
                                        ${CONFIG.FILE_TYPES.map(type => 
                                            `<option value="${type}" ${this.state.filters.fileType === type ? 'selected' : ''}>${type}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="startDate">From Date</label>
                                    <input 
                                        type="date" 
                                        id="startDate" 
                                        class="form-input"
                                        value="${this.state.filters.startDate}"
                                    >
                                </div>
                                <div class="form-group">
                                    <label for="endDate">To Date</label>
                                    <input 
                                        type="date" 
                                        id="endDate" 
                                        class="form-input"
                                        value="${this.state.filters.endDate}"
                                    >
                                </div>
                                <div class="filter-actions">
                                    <button type="submit" class="btn btn-primary">Apply</button>
                                    <button type="button" class="btn btn-secondary" onclick="App.clearFilters()">Clear</button>
                                    <button type="button" class="btn btn-success" onclick="App.exportToExcel()">Export</button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <!-- Records Table -->
                    <div class="card">
                        <div class="card-header">
                            <h2 class="card-title">File Records</h2>
                            <div id="total-records"></div>
                        </div>
                        <div class="card-body" style="padding: 0;">
                            <div id="records-container"></div>
                        </div>
                    </div>
                </main>
            </div>

            <!-- Edit Modal -->
            <div id="edit-modal" class="modal-overlay">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">Edit Record</h3>
                        <button class="modal-close" onclick="App.closeEditModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="edit-form">
                            <div class="form-group">
                                <label for="edit-description">Description <span class="required">*</span></label>
                                <textarea id="edit-description" class="form-textarea" required></textarea>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="edit-fileDate">File Date</label>
                                    <input type="date" id="edit-fileDate" class="form-input">
                                </div>
                                <div class="form-group">
                                    <label for="edit-letterRef">Letter Reference</label>
                                    <input type="text" id="edit-letterRef" class="form-input">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Replace File (optional)</label>
                                <input type="file" id="edit-file" class="form-input">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="App.closeEditModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="App.saveEdit()">Save Changes</button>
                    </div>
                </div>
            </div>

            <!-- Delete Confirmation Modal -->
            <div id="delete-modal" class="modal-overlay">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">Confirm Delete</h3>
                        <button class="modal-close" onclick="App.closeDeleteModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>Are you sure you want to delete this record? This action cannot be undone.</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="App.closeDeleteModal()">Cancel</button>
                        <button class="btn btn-danger" onclick="App.confirmDelete()">Delete</button>
                    </div>
                </div>
            </div>
        `;

        // Attach event listeners
        this.attachEventListeners();
    },

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Upload form
        document.getElementById('upload-form').addEventListener('submit', this.handleUpload.bind(this));
        
        // File input display
        document.getElementById('file').addEventListener('change', (e) => {
            const fileName = e.target.files[0]?.name || '';
            document.getElementById('selected-file-name').textContent = fileName;
        });

        // Filter form
        document.getElementById('filter-form').addEventListener('submit', this.handleFilter.bind(this));
    },

    /**
     * Load records from API
     */
    async loadRecords() {
        try {
            this.showLoading('Loading records...');
            
            const params = {
                search: this.state.filters.search,
                fileType: this.state.filters.fileType,
                startDate: this.state.filters.startDate,
                endDate: this.state.filters.endDate,
                sortBy: this.state.filters.sortBy,
                sortOrder: this.state.filters.sortOrder,
                page: this.state.filters.page,
                limit: CONFIG.DEFAULT_PAGE_SIZE
            };

            // Remove empty params
            Object.keys(params).forEach(key => {
                if (!params[key]) delete params[key];
            });

            const result = await API.files.getAll(params);
            
            if (result.success) {
                this.state.records = result.data.records;
                this.state.pagination = result.data.pagination;
                this.renderRecords();
            }
        } catch (error) {
            this.showMessage('error', error.message);
        } finally {
            this.hideLoading();
        }
    },

    /**
     * Render records table
     */
    renderRecords() {
        const container = document.getElementById('records-container');
        const totalDiv = document.getElementById('total-records');
        const { records, pagination } = this.state;

        // Update total count
        totalDiv.innerHTML = `<span style="color: var(--text-secondary);">Total: <strong>${pagination?.totalRecords || 0}</strong></span>`;

        if (!records || records.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📂</div>
                    <h3 class="empty-title">No Records Found</h3>
                    <p class="empty-text">Start by uploading a new file above.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>S.No.</th>
                            <th>Description</th>
                            <th>File Date</th>
                            <th>Letter Ref</th>
                            <th>File Name</th>
                            <th>Type</th>
                            <th>Upload Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${records.map((record, index) => `
                            <tr>
                                <td>${((pagination?.currentPage - 1) * CONFIG.DEFAULT_PAGE_SIZE) + index + 1}</td>
                                <td class="truncate max-w-xs" title="${this.escapeHtml(record.description)}">${this.escapeHtml(record.description)}</td>
                                <td>${record.fileDate ? new Date(record.fileDate).toLocaleDateString() : '—'}</td>
                                <td>${record.letterReferenceNumber || '—'}</td>
                                <td class="truncate max-w-xs" title="${this.escapeHtml(record.originalName)}">${this.escapeHtml(record.originalName)}</td>
                                <td><span class="badge badge-${record.fileType.toLowerCase()}">${record.fileType}</span></td>
                                <td>${new Date(record.uploadDateTime).toLocaleString()}</td>
                                <td>
                                    <div class="action-buttons">
                                        <button class="btn-action btn-edit" onclick="App.openEditModal('${record._id}')">Edit</button>
                                        <button class="btn-action btn-download" onclick="App.downloadFile('${record._id}')">Download</button>
                                        <button class="btn-action btn-delete" onclick="App.openDeleteModal('${record._id}')">Delete</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ${this.renderPagination()}
        `;
    },

    /**
     * Render pagination
     */
    renderPagination() {
        const { pagination } = this.state;
        if (!pagination || pagination.totalPages <= 1) return '';

        return `
            <div class="pagination">
                <button 
                    class="pagination-btn" 
                    onclick="App.goToPage(1)"
                    ${pagination.currentPage === 1 ? 'disabled' : ''}
                >First</button>
                <button 
                    class="pagination-btn" 
                    onclick="App.goToPage(${pagination.currentPage - 1})"
                    ${!pagination.hasPrevPage ? 'disabled' : ''}
                >Previous</button>
                <span class="pagination-info">
                    Page ${pagination.currentPage} of ${pagination.totalPages}
                </span>
                <button 
                    class="pagination-btn" 
                    onclick="App.goToPage(${pagination.currentPage + 1})"
                    ${!pagination.hasNextPage ? 'disabled' : ''}
                >Next</button>
                <button 
                    class="pagination-btn" 
                    onclick="App.goToPage(${pagination.totalPages})"
                    ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}
                >Last</button>
            </div>
        `;
    },

    /**
     * Go to specific page
     */
    goToPage(page) {
        this.state.filters.page = page;
        this.loadRecords();
    },

    /**
     * Handle file upload
     */
    async handleUpload(e) {
        e.preventDefault();

        const formData = new FormData();
        formData.append('description', document.getElementById('description').value);
        formData.append('fileDate', document.getElementById('fileDate').value);
        formData.append('letterReferenceNumber', document.getElementById('letterRef').value);
        formData.append('file', document.getElementById('file').files[0]);

        try {
            this.showLoading('Uploading file...');
            const result = await API.files.create(formData);
            
            if (result.success) {
                this.showMessage('success', 'File uploaded successfully!');
                e.target.reset();
                document.getElementById('selected-file-name').textContent = '';
                this.loadRecords();
            }
        } catch (error) {
            this.showMessage('error', error.message);
        } finally {
            this.hideLoading();
        }
    },

    /**
     * Handle filter submission
     */
    handleFilter(e) {
        e.preventDefault();
        
        this.state.filters = {
            ...this.state.filters,
            search: document.getElementById('search').value,
            fileType: document.getElementById('filterType').value,
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            page: 1
        };

        this.loadRecords();
    },

    /**
     * Clear all filters
     */
    clearFilters() {
        this.state.filters = {
            search: '',
            fileType: '',
            startDate: '',
            endDate: '',
            sortBy: 'uploadDateTime',
            sortOrder: 'desc',
            page: 1
        };

        document.getElementById('search').value = '';
        document.getElementById('filterType').value = '';
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';

        this.loadRecords();
    },

    /**
     * Download file
     */
    async downloadFile(id) {
        try {
            this.showLoading('Preparing download...');
            await API.files.download(id);
        } catch (error) {
            this.showMessage('error', 'Download failed: ' + error.message);
        } finally {
            this.hideLoading();
        }
    },

    /**
     * Export to Excel
     */
    async exportToExcel() {
        try {
            this.showLoading('Exporting records...');
            
            const params = {
                search: this.state.filters.search,
                fileType: this.state.filters.fileType,
                startDate: this.state.filters.startDate,
                endDate: this.state.filters.endDate,
                sortBy: this.state.filters.sortBy,
                sortOrder: this.state.filters.sortOrder
            };

            // Remove empty params
            Object.keys(params).forEach(key => {
                if (!params[key]) delete params[key];
            });

            await API.files.exportToExcel(params);
            this.showMessage('success', 'Export completed!');
        } catch (error) {
            this.showMessage('error', 'Export failed: ' + error.message);
        } finally {
            this.hideLoading();
        }
    },

    /**
     * Open edit modal
     */
    async openEditModal(id) {
        try {
            this.showLoading('Loading record...');
            const result = await API.files.getOne(id);
            
            if (result.success) {
                this.state.editingRecord = result.data;
                
                document.getElementById('edit-description').value = result.data.description;
                document.getElementById('edit-fileDate').value = result.data.fileDate ? result.data.fileDate.split('T')[0] : '';
                document.getElementById('edit-letterRef').value = result.data.letterReferenceNumber || '';
                document.getElementById('edit-file').value = '';
                
                document.getElementById('edit-modal').classList.add('active');
            }
        } catch (error) {
            this.showMessage('error', error.message);
        } finally {
            this.hideLoading();
        }
    },

    /**
     * Close edit modal
     */
    closeEditModal() {
        document.getElementById('edit-modal').classList.remove('active');
        this.state.editingRecord = null;
    },

    /**
     * Save edit
     */
    async saveEdit() {
        if (!this.state.editingRecord) return;

        const formData = new FormData();
        formData.append('description', document.getElementById('edit-description').value);
        formData.append('fileDate', document.getElementById('edit-fileDate').value);
        formData.append('letterReferenceNumber', document.getElementById('edit-letterRef').value);
        
        const file = document.getElementById('edit-file').files[0];
        if (file) {
            formData.append('file', file);
        }

        try {
            this.showLoading('Saving changes...');
            const result = await API.files.update(this.state.editingRecord._id, formData);
            
            if (result.success) {
                this.showMessage('success', 'Record updated successfully!');
                this.closeEditModal();
                this.loadRecords();
            }
        } catch (error) {
            this.showMessage('error', error.message);
        } finally {
            this.hideLoading();
        }
    },

    /**
     * Open delete confirmation modal
     */
    openDeleteModal(id) {
        this.state.deletingId = id;
        document.getElementById('delete-modal').classList.add('active');
    },

    /**
     * Close delete modal
     */
    closeDeleteModal() {
        document.getElementById('delete-modal').classList.remove('active');
        this.state.deletingId = null;
    },

    /**
     * Confirm delete
     */
    async confirmDelete() {
        if (!this.state.deletingId) return;

        try {
            this.showLoading('Deleting record...');
            const result = await API.files.delete(this.state.deletingId);
            
            if (result.success) {
                this.showMessage('success', 'Record deleted successfully!');
                this.closeDeleteModal();
                this.loadRecords();
            }
        } catch (error) {
            this.showMessage('error', error.message);
        } finally {
            this.hideLoading();
        }
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());