# MacMan Backend v2

Modern TypeScript backend for MacMan - Professional Mac Storage Management Tool.

## 🚀 Features

- ✅ **TypeScript** - Full type safety
- ✅ **Prisma ORM** - Type-safe database access
- ✅ **PostgreSQL** - Production-ready database
- ✅ **JWT Authentication** - Secure admin access
- ✅ **Rate Limiting** - API protection
- ✅ **Zod Validation** - Request validation
- ✅ **Error Handling** - Comprehensive error management
- ✅ **Logging** - Structured logging
- ✅ **File Uploads** - DMG file management
- ✅ **Docker Support** - Containerized deployment
- ✅ **Railway & Fly.io Ready** - Multiple deployment options

## 📦 Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Validation:** Zod
- **Authentication:** JWT + Secret-based

## 🏗️ Project Structure

```
backend-v2/
├── src/
│   ├── config/          # Environment & configuration
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── routes/          # API routes
│   ├── middleware/      # Auth, validation, error handling
│   ├── utils/           # Helper functions
│   ├── types/           # TypeScript types
│   └── index.ts         # Entry point
├── prisma/
│   └── schema.prisma    # Database schema
├── package.json
├── tsconfig.json
├── Dockerfile
├── fly.toml             # Fly.io config
└── railway.json         # Railway config
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend-v2
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file:

```env
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/macman

# JWT Secret (minimum 32 characters)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-32chars

# Admin Secret (minimum 16 characters)
ADMIN_SECRET=your-admin-secret-key

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# File Upload
MAX_FILE_SIZE=500000000
UPLOAD_DIR=./uploads
```

### 3. Set Up Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations (for dev)
npm run prisma:migrate

# Or push schema (for production)
npm run prisma:push
```

### 4. Start Development Server

```bash
npm run dev
```

Server will start at `http://localhost:3000`

## 📚 API Endpoints

### Public Endpoints

#### License Validation
```bash
POST /api/licenses/validate
Content-Type: application/json

{
  "license_key": "MACMAN-XXXXX-XXXXX-XXXXX",
  "machine_id": "uuid-here",
  "device_name": "MacBook Pro",
  "os_version": "14.0",
  "app_version": "1.0.8"
}
```

#### Check for Updates
```bash
GET /api/v2/updates/check?version=1.0.0&platform=darwin&userId=uuid
```

#### Download Update
```bash
GET /api/v2/updates/download/1.0.8
```

### Admin Endpoints (Require X-Admin-Secret Header)

#### Create License
```bash
POST /api/admin/licenses
X-Admin-Secret: your-admin-secret
Content-Type: application/json

{
  "email": "user@example.com",
  "plan": "Individual",
  "max_devices": 1
}
```

#### Get All Licenses
```bash
GET /api/admin/licenses?page=1&limit=50
X-Admin-Secret: your-admin-secret
```

#### Create Update
```bash
POST /api/admin/updates
X-Admin-Secret: your-admin-secret
Content-Type: application/json

{
  "version": "1.0.9",
  "buildNumber": 10009,
  "releaseType": "normal",
  "filename": "MacMan-1.0.9.dmg",
  "fileSize": 50000000,
  "checksum": "sha256-hash-here",
  "releaseNotes": "Bug fixes and improvements",
  "forceUpdate": false
}
```

#### Get Statistics
```bash
GET /api/admin/licenses/stats
X-Admin-Secret: your-admin-secret

GET /api/admin/updates/stats
X-Admin-Secret: your-admin-secret
```

## 🚀 Deployment

### Railway

1. **Create Railway Project:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add PostgreSQL
railway add --plugin postgresql

# Deploy
railway up
```

2. **Set Environment Variables in Railway:**
- `DATABASE_URL` (auto-set by PostgreSQL plugin)
- `JWT_SECRET`
- `ADMIN_SECRET`
- `ALLOWED_ORIGINS`
- `NODE_ENV=production`

3. **Access your app:**
```
https://your-app.up.railway.app
```

### Fly.io

1. **Install Fly CLI:**
```bash
curl -L https://fly.io/install.sh | sh
```

2. **Login and Deploy:**
```bash
fly auth login
fly launch  # Follow prompts
fly secrets set JWT_SECRET=your-secret
fly secrets set ADMIN_SECRET=your-secret
fly secrets set DATABASE_URL=your-postgres-url
fly deploy
```

3. **Create Volume for Uploads:**
```bash
fly volumes create macman_uploads --size 10
```

### Docker

```bash
# Build
docker build -t macman-backend-v2 .

# Run
docker run -p 3000:8080 \
  -e DATABASE_URL=your-db-url \
  -e JWT_SECRET=your-secret \
  -e ADMIN_SECRET=your-secret \
  macman-backend-v2
```

## 🧪 Testing

```bash
# Health check
curl http://localhost:3000/health

# Validate license
curl -X POST http://localhost:3000/api/licenses/validate \
  -H "Content-Type: application/json" \
  -d '{
    "license_key": "MACMAN-XXXXX-XXXXX-XXXXX",
    "machine_id": "test-machine-id"
  }'

# Check for updates
curl "http://localhost:3000/api/v2/updates/check?version=1.0.0&userId=test&platform=darwin"

# Admin endpoints
curl http://localhost:3000/api/admin/licenses/stats \
  -H "X-Admin-Secret: your-admin-secret"
```

## 📊 Database Schema

See `prisma/schema.prisma` for the full schema.

**Main Tables:**
- `licenses` - License keys and activation info
- `license_activations` - Device activations
- `payments` - Payment records
- `updates` - App updates
- `update_history` - Update tracking
- `admins` - Admin users
- `analytics` - Event tracking

## 🔐 Security

- JWT tokens for admin authentication
- Rate limiting on all endpoints
- Stricter rate limiting on sensitive endpoints
- Helmet.js for security headers
- CORS configuration
- Input validation with Zod
- Environment variable validation

## 📝 Migration from v1

The new backend is **backwards compatible** with the existing Swift app:

- `/api/validate-key` → redirects to `/api/licenses/validate`
- `/api/v2/check-update` → redirects to `/api/v2/updates/check`

Simply update your environment variables and deploy!

## 🛠️ Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Open Prisma Studio (database GUI)
npm run prisma:studio
```

## 📈 Monitoring

- Health check: `GET /health`
- Statistics: `GET /api/admin/licenses/stats` and `/api/admin/updates/stats`
- Structured logging in production (JSON format)
- Pretty logging in development

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

---

**Built with ❤️ for MacMan - Professional Mac Storage Management**

