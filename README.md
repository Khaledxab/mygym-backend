# Gym Access Management API

A comprehensive RESTful API backend for a Flutter mobile app that manages gym access and user rewards through a points system. This API provides role-based access control, user authentication, points system, QR code scanning for gym access, and comprehensive gym and user management.

## Features

- **Authentication & Authorization**
  - JWT token-based authentication
  - Role-based access control with four distinct roles
  - Secure password hashing
  - Protected admin registration endpoints

- **Points System**
  - Users earn/spend points for gym access
  - Transaction history with timestamps and metadata
  - Points management for admins

- **QR Code System**
  - Generate unique QR codes for gyms
  - Scanning QR codes for gym access
  - Automatic points deduction on scan

- **Gym Management**
  - Complete CRUD operations for gyms
  - Location tracking and details
  - Opening hours and amenities

- **User Management**
  - User profiles with CRUD operations
  - Points balance tracking
  - Activity logging

## Tech Stack

- **Node.js & Express.js** - Backend server
- **MongoDB & Mongoose** - Database and ODM
- **JSON Web Tokens (JWT)** - Authentication
- **bcryptjs** - Password hashing
- **QRCode** - QR code generation
- **Express Validator** - Request validation
- **Docker** - Containerization

## Project Structure

```
├── config/                  # Configuration files
│   ├── database.js          # MongoDB connection setup
│   └── roles.js             # Role definitions
├── controllers/             # Request handlers
│   ├── authController.js    # Authentication logic
│   ├── gymController.js     # Gym management
│   ├── transactionController.js # Point transactions
│   ├── qrController.js      # QR code generation & verification
│   └── userController.js    # User management
├── middleware/              # Custom middleware
│   ├── auth.js              # JWT authentication
│   ├── errorHandler.js      # Global error handling
│   ├── roleCheck.js         # Role-based access control
│   └── validate.js          # Request validation
├── models/                  # MongoDB schemas
│   ├── Gym.js               # Gym model
│   ├── Transaction.js       # Transaction model
│   └── User.js              # User model
├── routes/                  # API routes
│   ├── authRoutes.js        # Authentication routes
│   ├── gymRoutes.js         # Gym management routes
│   ├── qrRoutes.js          # QR code routes
│   ├── transactionRoutes.js # Transaction routes
│   └── userRoutes.js        # User management routes
├── utils/                   # Utility functions
│   ├── qrGenerator.js       # QR code generation
│   └── responseHandler.js   # Standardized API responses
├── .env.example             # Example environment variables
├── .gitignore               # Git ignore file
├── app.js                   # Express app setup
├── createSuperAdmin.js      # Script to create first super admin
├── docker-compose.yml       # Docker Compose configuration
├── Dockerfile               # Docker configuration
└── package.json             # Project dependencies
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- MongoDB database (or use the Docker setup)
- Docker and Docker Compose (for containerized deployment)

### Local Development Setup

1. Clone the repository
   ```bash
   git clone https://github.com/khaledxab/mygym-backend.git
   cd gym-access-management-api
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables in the `.env` file

5. Start the server
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

### Docker Setup

1. Make sure Docker and Docker Compose are installed

2. Build and start the containers
   ```bash
   docker-compose up -d
   ```

3. Create the first Super Admin user
   ```bash
   docker exec -it gym-access-api_api_1 node createSuperAdmin.js
   ```

## Security Features

### Secured Registration Routes

The API implements separate secured routes for user registration:

- **Regular User Registration (Public)**: `/api/auth/register`
  - Only creates accounts with USER role
  - Accessible to anyone

- **Admin Registration (Protected)**: `/api/auth/register-admin`
  - Can create accounts with any role (admin, gym, super_admin)
  - Only accessible to authenticated SUPER_ADMIN users
  - Requires valid JWT token in Authorization header

This prevents unauthorized role escalation by ensuring only super admins can create accounts with elevated privileges.

### Role-Based Access Control

Four distinct user roles with appropriate permissions:

- **Super Admin**: Can manage all gyms, users, and admins across the platform
- **Admin**: Can manage gyms and users within their assigned gym(s)
- **Gym**: Can view and manage registered users and point transactions for their gym
- **User**: Can view available gyms, their point balance, and redeem points

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new regular user (USER role only)
- `POST /api/auth/register-admin` - Register a new admin (Protected, SUPER_ADMIN only)
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh-token` - Refresh JWT token
- `PUT /api/auth/change-password` - Change user password

### Users

- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/:id/points` - Get user points
- `POST /api/users/:id/points` - Add points to user
- `GET /api/users/gym/:gymId` - Get users by gym

### Gyms

- `POST /api/gyms` - Create a new gym
- `GET /api/gyms` - Get all gyms
- `GET /api/gyms/:id` - Get gym by ID
- `PUT /api/gyms/:id` - Update gym
- `DELETE /api/gyms/:id` - Delete gym
- `POST /api/gyms/:id/admins` - Assign admin to gym
- `DELETE /api/gyms/:id/admins/:userId` - Remove admin from gym

### QR Codes

- `GET /api/qr/generate/:gymId` - Generate QR code for gym
- `POST /api/qr/scan` - Process QR code scan for gym access
- `GET /api/qr/status/:gymId` - Check current QR code status

### Transactions

- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create manual transaction
- `GET /api/transactions/user/:userId` - Get user transactions
- `GET /api/transactions/gym/:gymId` - Get gym transactions
- `GET /api/transactions/:id` - Get transaction by ID


## Role Permissions

| Permission | Super Admin | Admin | Gym | User |
|------------|------------|-------|-----|------|
| Create Gym | ✓ | ✓ | ✗ | ✗ |
| Update Gym | ✓ | ✓ | ✗ | ✗ |
| Delete Gym | ✓ | ✗ | ✗ | ✗ |
| Create User | ✓ | ✓ | ✓ | ✗ |
| Update User | ✓ | ✓ | ✓ | Self Only |
| Delete User | ✓ | ✓ | ✗ | ✗ |
| Manage Admins | ✓ | ✗ | ✗ | ✗ |
| Assign Gym | ✓ | ✓ | ✗ | ✗ |
| View All Transactions | ✓ | ✓ | ✗ | ✗ |
| Create Transaction | ✓ | ✓ | ✓ | ✗ |
| Generate QR | ✓ | ✓ | ✓ | ✗ |
| Scan QR | ✗ | ✗ | ✗ | ✓ |

## Testing with Postman

A Postman collection is included in the repository for testing all API endpoints. Import the file `Gym-Access-Management-API.postman_collection.json` into Postman to get started.

The collection includes:
- Authentication flow
- User management operations
- Gym management operations
- QR code generation and scanning
- Transaction creation and retrieval

## Creating a Super Admin

Run the included script to create your first Super Admin:

```bash
# Local development
node createSuperAdmin.js

# Docker environment
docker exec -it gym-access-api_api_1 node createSuperAdmin.js
```

This script will prompt for a name, email, and password, then create a Super Admin account with full system access.

