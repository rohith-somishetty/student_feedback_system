# Nexus Student Issue Resolution Platform - Full Stack Setup

## ✅ Backend & Frontend Successfully Implemented

### Architecture
- **Backend**: Node.js + Express + LowDB (JSON database)
- **Frontend**: React + TypeScript + Vite
- **Auth**: JWT with bcrypt password hashing
- **File Upload**: Multer middleware

---

## 🚀 Running the Application

### 1. Start Backend Server (Required)
```bash
cd server
npm start
```
**Backend runs on**: `http://localhost:3001`

### 2. Start Frontend Dev Server
```bash
# In the root directory
npm run dev
```
**Frontend runs on**: `http://localhost:5173`

---

## 🔐 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| **Student** | alex@student.edu | 0000 |
| **Admin** | sarah@admin.edu | 0000 |
| **Super Admin** | leadership@institution.edu | 0000 |

---

## ✨ Implemented Features

### Backend API Endpoints

#### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/register` - Register new student account

#### Users
- `GET /api/users` - Get all users (protected)
- `GET /api/users/me` - Get current user
- `PUT /api/users/:id` - Update user profile
- `GET /api/users/:id/supports` - Get user's supports

#### Issues
- `GET /api/issues` - Get all issues with timeline
- `POST /api/issues` - Create new issue (with file upload)
- `PUT /api/issues/:id` - Update issue
- `POST /api/issues/:id/support` - Support an issue
- `POST /api/issues/:id/comments` - Add comment
- `POST /api/issues/:id/proposals` - Add proposal
- `POST /api/issues/:id/timeline` - Add timeline event

#### Departments
- `GET /api/departments` - Get all departments
- `GET /api/departments/supports` - Get all supports for metrics

### Frontend Features

1. ✅ **JWT Authentication** - Secure login with token-based auth
2. ✅ **Role-Based Access Control** - Student, Admin, Super Admin roles
3. ✅ **Issue Management** - Create, view, update issues
4. ✅ **Timeline Tracking** - Full audit trail of all actions
5. ✅ **Weighted Voting** - Credibility-based priority scoring
6. ✅ **Contest Mechanism** - Students can contest resolved issues
7. ✅ **Escalation System** - Super Admin can escalate to higher authority
8. ✅ **Governance Dashboard** - Leadership analytics and metrics
9. ✅ **File Upload** - Evidence attachment support
10. ✅ **Overdue Detection** - Automatic deadline tracking

---

## 📁 Database

- **Type**: JSON file-based (LowDB)
- **Location**: `server/db.json`
- **Auto-seeded** on first run with test data

### Database Schema
```json
{
  "users": [...],
  "issues": [...],
  "timeline": [...],
  "supports": [...],
  "comments": [...],
  "proposals": [...],
  "departments": [...]
}
```

---

## 🔄 API Flow

### Creating an Issue
1. Frontend: User fills form in `IssueForm.tsx`
2. API Call: `POST /api/issues` with FormData (including file)
3. Backend: Multer processes file, saves to `/uploads`
4. Database: Issue saved to `db.json`
5. Response: Issue ID + evidence URL returned
6. Frontend: Redirects to issue list

### Supporting an Issue
1. Frontend: User clicks support button
2. API Call: `POST /api/issues/:id/support`
3. Backend: Checks for duplicate support
4. Database: Adds support record, updates priority score
5. Timeline: Adds SUPPORT event
6. Response: Updated issue data
7. Frontend: UI updates with new counts

---

## 🎯 Testing the Platform

1. **Login** as student (alex@student.edu/0000)
2. **Create an issue** with category and urgency
3. **Login** as another user and **support** the issue
4. **Login** as admin (sarah@admin.edu/0000) 
5. **Resolve** the issue with evidence link
6. **Login** as student and **contest** the resolution
7. **Login** as Super Admin (leadership@institution.edu/0000)
8. View **Governance Dashboard** for analytics
9. **Escalate** contested issue to higher authority

---

## 🛠️ Development

### Backend Structure
```
server/
├── server.js          # Main Express app
├── database.js        # LowDB setup & seeding
├── .env              # Environment variables
├── middleware/
│   ├── auth.js       # JWT authentication
│   └── upload.js     # Multer file upload
└── routes/
    ├── auth.js       # Login/Register
    ├── users.js      # User management
    ├── issues.js     # Issue CRUD
    └── departments.js # Departments/Supports
```

### Frontend Integration
- `services/api.ts` - API client with auth header injection
- All components updated to use API instead of localStorage
- Loading states and error handling implemented

---

## 🐛 Troubleshooting

### Backend won't start
- Check if port 3001 is available
- Run `npm install` in `server/` directory

### Frontend can't connect to backend
- Ensure backend is running on port 3001
- Check CORS settings in `server/server.js`
- Verify API_URL in `services/api.ts`

### File uploads fail
- Check `server/uploads` directory exists
- Verify file size < 5MB
- Only JPEG, PNG, PDF allowed

---

## 📊 Production Deployment

### Backend
1. Set `NODE_ENV=production` in `.env`
2. Change `JWT_SECRET` to a strong random string
3. Use a proper database (PostgreSQL/MongoDB) instead of LowDB
4. Deploy to Heroku/Railway/Render

### Frontend
1. Update `API_URL` in `services/api.ts` to production backend URL
2. Run `npm run build`
3. Deploy `dist/` folder to Vercel/Netlify

---

## 🎉 Success!

The platform is now fully operational with:
- ✅ Secure authentication
- ✅ Complete CRUD operations
- ✅ File storage
- ✅ Real-time updates
- ✅ Governance features
- ✅ Timeline tracking

**Everything is working!** 🚀
