# 📁 File Management System - MANE Stack

A full-stack file management system built with the **MANE Stack**:
- **M**ongoDB - Database
- **A**ngular/React - Frontend (React-friendly vanilla JS)
- **N**ode.js - Runtime
- **E**xpress.js - Backend Framework

## 🚀 Features

- **User Authentication**
  - Secure login system
  - JWT token-based authentication
  - Password hashing with bcrypt (12 rounds)
  - Session management

- **File Management**
  - Upload files with descriptions
  - Add file date and letter reference numbers
  - Automatic file type detection
  - Download files
  - Edit file metadata
  - Delete files (with physical file removal)

- **Search & Filter**
  - Search by description
  - Filter by file type (PDF, DOCX, XLSX, Image, Other)
  - Filter by date range
  - Sort by various fields
  - Pagination support

- **Export**
  - Export records to Excel
  - Download as ZIP with all files included

## 📋 Prerequisites

Before running this project, make sure you have:

1. **Node.js** (v16 or higher)
   ```bash
   node --version  # Should be >= 16.0.0
   ```

2. **MongoDB** (v5 or higher)
   - Local installation OR
   - MongoDB Atlas cloud instance
   
3. **npm** (comes with Node.js)

## 🛠️ Installation

### 1. Clone/Navigate to the project

```bash
cd mane
```

### 2. Install all dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Or use the convenience script from root
cd ..
npm run install:all
```

### 3. Configure Environment Variables

Edit the `.env` file in `backend/` folder:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/file_management_system

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Default User Credentials (for seeding)
DEFAULT_USER_ID=MESGCC
DEFAULT_USER_PASSWORD=BBA@123
```

⚠️ **Important:** Change `JWT_SECRET` to a secure random string in production!

### 4. Seed the Default User

Create the default user with credentials from `.env`:

```bash
# From root directory
npm run seed

# Or from backend directory
cd backend
npm run seed
```

This creates a user:
- **User ID:** MESGCC
- **Password:** BBA@123

The password is securely hashed with bcrypt before storing.

## 🏃 Running the Application

### Development Mode

**Option 1: Run backend and frontend separately**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm start
```

**Option 2: Run both together**

```bash
npm run dev:full
```

### Production Mode

```bash
npm start
```

### Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **API Health Check:** http://localhost:5000/api/health

## 📁 Project Structure

```
mane/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js  # Authentication logic
│   │   ├── fileController.js  # File CRUD operations
│   │   └── index.js
│   ├── middlewares/
│   │   ├── authMiddleware.js  # JWT verification
│   │   ├── uploadMiddleware.js # Multer file upload
│   │   ├── errorMiddleware.js # Error handling
│   │   └── index.js
│   ├── models/
│   │   ├── User.js            # User schema with bcrypt
│   │   ├── FileRecord.js      # File record schema
│   │   └── index.js
│   ├── routes/
│   │   ├── authRoutes.js      # Auth endpoints
│   │   ├── fileRoutes.js      # File endpoints
│   │   └── index.js
│   ├── utils/
│   │   ├── seedUser.js        # User seeding script
│   │   └── index.js
│   ├── uploads/               # Uploaded files storage
│   ├── .env                   # Environment variables
│   ├── package.json
│   └── server.js              # Express server entry
│
├── frontend/
│   ├── public/
│   │   ├── css/
│   │   │   └── app.css        # Styles
│   │   ├── js/
│   │   │   ├── config.js      # Frontend config
│   │   │   ├── api.js         # API service
│   │   │   └── app.js         # Main application
│   │   ├── images/
│   │   └── index.html         # Entry HTML
│   ├── src/                   # React source (for future)
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── styles/
│   └── package.json
│
├── package.json               # Root package.json
└── README.md
```

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/change-password` | Change password |

### File Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/files` | Get all files (with pagination) |
| GET | `/api/files/:id` | Get single file |
| POST | `/api/files` | Upload new file |
| PUT | `/api/files/:id` | Update file |
| DELETE | `/api/files/:id` | Delete file |
| GET | `/api/files/:id/download` | Download file |
| GET | `/api/files/export` | Export to Excel (ZIP) |
| GET | `/api/files/stats` | Get statistics |

### Query Parameters for `/api/files`

| Parameter | Type | Description |
|-----------|------|-------------|
| search | string | Search in description |
| fileType | string | Filter by file type |
| startDate | string | Start date (YYYY-MM-DD) |
| endDate | string | End date (YYYY-MM-DD) |
| sortBy | string | Sort field |
| sortOrder | string | 'asc' or 'desc' |
| page | number | Page number |
| limit | number | Records per page |

## 🔒 Security Features

1. **Password Security**
   - Passwords hashed with bcrypt (12 salt rounds)
   - Password never stored in plain text
   - Password not returned in API responses

2. **JWT Authentication**
   - Secure token-based auth
   - Configurable token expiration
   - Token verification middleware

3. **Input Validation**
   - Request validation
   - File type filtering
   - File size limits

4. **Environment Variables**
   - Secrets stored in `.env`
   - Not committed to version control

## 🔧 Troubleshooting

### MongoDB Connection Error

Make sure MongoDB is running:
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

### Port Already in Use

Change the port in `.env`:
```env
PORT=5001
```

### Seed User Exists

To re-seed, delete the user first:
```bash
npm run seed:delete
npm run seed
```

## 📝 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

Built with ❤️ using the MANE Stack

