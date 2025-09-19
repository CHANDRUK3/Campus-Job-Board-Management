# 🎓 Campus Job Board

A complete campus job board application that connects students with job opportunities and provides comprehensive admin management tools.

## ✨ Features

### For Students
- 🔐 **Secure Authentication** - JWT-based login/registration
- 📝 **Profile Management** - Create and update academic profiles
- 📄 **Resume Upload** - Upload and manage PDF resumes
- 🔍 **Advanced Job Search** - Search jobs with filters and sorting
- 📊 **Application Tracking** - Track application status and timeline
- 🎤 **Interview Management** - View upcoming interviews and feedback
- 💬 **Feedback System** - Submit feedback on application processes

### For Admins
- 📈 **Analytics Dashboard** - Comprehensive placement statistics
- 💼 **Job Management** - Create, update, and manage job postings
- 📧 **Bulk Operations** - Send bulk emails and manage multiple jobs
- 📊 **Reports** - Generate placement reports and export data
- 👥 **Student Management** - View student profiles and applications
- 🔄 **Bulk Import/Export** - Import jobs from Excel/CSV files

### System Features
- 🛡️ **Security** - Rate limiting, CORS, helmet security headers
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🔄 **Real-time Updates** - Live notifications and status updates
- 📁 **File Management** - Secure file upload and serving
- 🎨 **Modern UI** - Clean and intuitive user interface

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (running locally or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd campus-job-board
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the `Backend` directory:
   ```env
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_EXPIRES_IN=30d
   MONGODB_URI=mongodb://localhost:27017/jobboard
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   FRONTEND_URL=http://localhost:5173
   NODE_ENV=development
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   
   # Or use MongoDB Atlas (cloud)
   # Update MONGODB_URI in .env file
   ```

5. **Seed the database with sample data**
   ```bash
   cd Backend
   npm run seed
   ```

6. **Start the application**
   ```bash
   npm start
   ```

   This will start both the backend (port 5000) and frontend (port 5173) servers.

### Alternative: Manual Start

If you prefer to start servers manually:

```bash
# Terminal 1 - Backend
cd Backend
npm run dev

# Terminal 2 - Frontend  
cd Job
npm run dev
```

## 📁 Project Structure

```
campus-job-board/
├── Backend/                 # Node.js/Express backend
│   ├── middleware/         # Authentication & validation
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── uploads/           # File uploads
│   └── utils/             # Utilities (JWT, etc.)
├── Job/                   # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   └── utils/         # API utilities
│   └── public/            # Static assets
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Jobs
- `GET /api/companies` - Get all jobs
- `GET /api/companies/search` - Search jobs with filters
- `POST /api/companies/add` - Create new job (admin)
- `GET /api/companies/:adminEmail` - Get jobs by admin
- `PUT /api/companies/:jobId/status` - Update job status
- `DELETE /api/companies/:jobId` - Delete job

### Student Profile
- `GET /api/profile/:userId` - Get student profile
- `PUT /api/profile/:userId` - Update profile (with resume upload)

### Applications
- `POST /api/student/applications` - Submit application
- `GET /api/student/applications` - Get student applications
- `GET /api/student/dashboard` - Get dashboard data

### Admin
- `GET /api/admin/analytics/dashboard` - Get analytics
- `POST /api/admin/bulk/send-email` - Send bulk email
- `GET /api/admin/bulk/export-jobs` - Export jobs
- `GET /api/admin/bulk/template` - Download template

## 🎯 Usage Guide

### For Students

1. **Register/Login**
   - Visit `http://localhost:5173/register`
   - Create account with email and password
   - Login at `http://localhost:5173/login`

2. **Complete Profile**
   - Go to Profile page
   - Add academic history
   - Upload resume (PDF only)
   - Add portfolio link

3. **Search and Apply**
   - Browse jobs on Jobs page
   - Use search and filters
   - Opt-in for jobs of interest
   - Submit applications

4. **Track Applications**
   - View dashboard for application status
   - Check upcoming interviews
   - Submit feedback

### For Admins

1. **Admin Access**
   - Register with role "admin"
   - Access admin dashboard

2. **Job Management**
   - Create new job postings
   - Manage existing jobs
   - Update job status

3. **Analytics**
   - View placement statistics
   - Generate reports
   - Export data

4. **Bulk Operations**
   - Send bulk emails to students
   - Import jobs from Excel/CSV
   - Export job and student data

## 🛠️ Development

### Backend Development
```bash
cd Backend
npm run dev  # Starts with nodemon for auto-reload
```

### Frontend Development
```bash
cd Job
npm run dev  # Starts Vite dev server
```

### Database
- Uses MongoDB with Mongoose ODM
- Models: User, Company, Application, Interview, Feedback, etc.
- Automatic indexing for performance

### Security Features
- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Helmet security headers
- File upload validation

## 📦 Production Deployment

### Backend Deployment
1. Set `NODE_ENV=production`
2. Use production MongoDB URI
3. Configure SMTP for emails
4. Set secure JWT secrets
5. Use PM2 or similar for process management

### Frontend Deployment
1. Build the React app: `npm run build`
2. Serve static files with nginx or similar
3. Configure API base URL for production

### Environment Variables (Production)
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=very-secure-secret
SMTP_HOST=smtp.gmail.com
SMTP_USER=production-email@domain.com
SMTP_PASS=production-app-password
FRONTEND_URL=https://your-domain.com
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🔄 Updates

### Version 1.0.0
- Initial release
- Complete student and admin functionality
- Resume upload system
- Advanced job search
- Analytics dashboard
- Bulk operations

---

**Made with ❤️ for campus placements**
