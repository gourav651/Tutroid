# Tutroid

A modern platform connecting trainers, students, and institutions for professional development and learning.

## 🌟 Features

### For Trainers
- Create and manage professional profiles
- Share courses and educational content
- Connect with students and institutions
- Track analytics and performance
- Receive reviews and ratings
- Real-time messaging

### For Students
- Discover and connect with trainers
- Access educational materials
- Track learning progress
- Rate and review courses
- Network with peers
- Real-time notifications

### For Institutions
- Find and hire qualified trainers
- Manage training programs
- Track institutional analytics
- Post job opportunities
- Review trainer profiles

## 🚀 Tech Stack

### Frontend
- **Framework:** React 19
- **Routing:** React Router v7
- **Styling:** Tailwind CSS v4
- **Build Tool:** Vite
- **Icons:** Lucide React
- **Charts:** Recharts
- **Real-time:** Socket.IO Client

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT
- **File Storage:** Cloudinary
- **Email:** Brevo (Sendinblue)
- **Real-time:** Socket.IO
- **Security:** Helmet, CORS, Rate Limiting
- **Caching:** Redis (ioredis)

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Cloudinary account (for file uploads)
- Brevo account (for emails)

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Tutroid
```

### 2. Backend Setup

```bash
cd Backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Configure environment variables
# Edit .env with your credentials

# Generate Prisma client
npm run prisma:generate

# Push database schema
npm run prisma:push

# Start development server
npm run dev
```

### 3. Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=https://tutroid.onrender.com" > .env

# Start development server
npm run dev
```

## 🔧 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-jwt-secret
NODE_ENV=development

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Brevo Email
BREVO_API_KEY=your-brevo-api-key
SENDER_EMAIL=noreply@tutroid.com
SENDER_NAME=Tutroid

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

### Frontend (.env)
```env
VITE_API_URL=https://tutroid.onrender.com
```

## 🚀 Deployment

### Backend (Render)
1. Push code to GitHub
2. Connect repository to Render
3. Set environment variables in Render dashboard
4. Deploy automatically on push

**Live Backend:** https://tutroid.onrender.com

### Frontend (Apache)
```bash
# Build production bundle
cd client
npm run build

# Upload dist/ folder to Apache server
# Ensure .htaccess is included for React Router
```

**Live Frontend:** https://tutroid.com

## 📁 Project Structure

```
Tutroid/
├── Backend/
│   ├── src/
│   │   ├── modules/          # Feature modules
│   │   ├── middleware/       # Express middleware
│   │   ├── services/         # Business logic
│   │   ├── socket/           # Socket.IO handlers
│   │   ├── config/           # Configuration files
│   │   ├── utils/            # Utility functions
│   │   ├── app.js            # Express app setup
│   │   ├── index.js          # Server entry point
│   │   └── db.js             # Database connection
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   ├── .env                  # Environment variables
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── assets/           # Components & pages
│   │   ├── components/       # Reusable components
│   │   ├── context/          # React context
│   │   ├── services/         # API services
│   │   ├── utils/            # Utility functions
│   │   ├── App.jsx           # Main app component
│   │   └── main.jsx          # Entry point
│   ├── public/               # Static assets
│   ├── .htaccess             # Apache configuration
│   └── package.json
│
└── README.md
```

## 🔑 Key Features Implementation

### Authentication
- JWT-based authentication
- Email verification with OTP
- Password reset functionality
- Role-based access control (Student, Trainer, Institution, Admin)

### Real-time Features
- Live messaging between users
- Real-time notifications
- Typing indicators
- Online status

### File Management
- Cloudinary integration for images
- Profile pictures and cover images
- Course materials upload
- Optimized image delivery

### Performance
- Redis caching for frequently accessed data
- Database query optimization
- Code splitting and lazy loading
- Compression and minification

### Security
- Helmet.js for security headers
- Rate limiting to prevent abuse
- XSS protection
- CORS configuration
- Input validation with Zod

## 🛡️ Admin Features

### Create Admin User
```bash
cd Backend
node create-admin.js
```

### Promote User to Admin
```bash
cd Backend
node promote-to-admin.js
```

## 📊 API Documentation

### Base URL
```
Production: https://tutroid.onrender.com/api/v1
Development: http://localhost:5000/api/v1
```

### Main Endpoints

#### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/verify-email` - Verify email with OTP
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

#### Users
- `GET /users/profile` - Get own profile
- `GET /users/profile/:username` - Get user profile
- `PUT /users/profile` - Update profile
- `GET /users/search` - Search users

#### Posts
- `GET /posts` - Get all posts
- `POST /posts` - Create post
- `PUT /posts/:id` - Update post
- `DELETE /posts/:id` - Delete post
- `POST /posts/:id/review` - Like/review post

#### Messaging
- `GET /messaging/conversations` - Get conversations
- `POST /messaging/send` - Send message
- `GET /messaging/:conversationId/messages` - Get messages

## 🧪 Testing

### Backend
```bash
cd Backend
npm run dev
# Visit http://localhost:5000/health
```

### Frontend
```bash
cd client
npm run dev
# Visit http://localhost:5173
```

## 📝 Scripts

### Backend
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:push` - Push schema to database

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Authors

- Development Team

## 🙏 Acknowledgments

- React team for the amazing framework
- Prisma for the excellent ORM
- Cloudinary for file storage
- Brevo for email services
- All open-source contributors

## 📞 Support

For support, email support@tutroid.com or visit https://tutroid.com

## 🔗 Links

- **Website:** https://tutroid.com
- **Backend API:** https://tutroid.onrender.com
- **Documentation:** See `/docs` folder

---

Made with ❤️ by the Tutroid Team
