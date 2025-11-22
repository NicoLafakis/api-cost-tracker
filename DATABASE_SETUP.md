# RoomSplit Database & Backend Setup

This guide will help you set up the MySQL database and backend server for RoomSplit.

## Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm or yarn

## Quick Start

### 1. Configure Environment Variables

Edit the `.env` file in the root directory with your MySQL credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=roomsplit
DB_USER=your_username
DB_PASSWORD=your_password

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=change-this-to-a-secure-random-string
JWT_EXPIRES_IN=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### 2. Create the Database

Run the schema SQL file to create all necessary tables:

```bash
# Using MySQL CLI
mysql -u root -p < server/database/schema.sql

# Or use npm script
npm run db:setup
```

### 3. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
npm run server:install
```

### 4. Start Development

```bash
# Run both frontend and backend concurrently
npm run dev:all

# Or run them separately:
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run dev:server
```

## Database Schema

The database includes the following tables:

### Core Tables
- **users** - User accounts and authentication
- **households** - Household information with invite codes
- **household_members** - User-to-household relationships with roles
- **roommates** - Roommate profiles (can be linked to user accounts)
- **rooms** - Room configurations with amenities
- **room_occupants** - Room-to-roommate assignments
- **expenses** - Expense records
- **expense_splits** - Individual splits per expense
- **agreements** - Household agreements
- **agreement_signatures** - Digital signatures

### Supporting Tables
- **sessions** - JWT token management
- **activity_log** - Real-time activity tracking
- **notifications** - User notifications

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verify JWT token

### Users
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update profile
- `PUT /api/users/me/password` - Change password
- `GET /api/users/me/households` - Get user's households
- `GET /api/users/me/notifications` - Get notifications

### Households
- `POST /api/households` - Create household
- `GET /api/households/:id` - Get household with all data
- `PUT /api/households/:id` - Update household
- `DELETE /api/households/:id` - Delete household
- `POST /api/households/join` - Join by invite code
- `POST /api/households/:id/invite-code` - Regenerate invite code
- `GET /api/households/:id/members` - Get members
- `GET /api/households/:id/activity` - Get activity log

### Roommates
- `POST /api/roommates` - Create roommate
- `PUT /api/roommates/:id` - Update roommate
- `DELETE /api/roommates/:id` - Delete roommate
- `POST /api/roommates/:id/link` - Link to user account

### Rooms
- `POST /api/rooms` - Create room
- `PUT /api/rooms/:id` - Update room
- `DELETE /api/rooms/:id` - Delete room

### Expenses
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `POST /api/expenses/:id/splits/:roommateId/pay` - Mark split as paid
- `POST /api/expenses/:id/splits/:roommateId/unpay` - Mark split as unpaid

### Agreements
- `POST /api/agreements` - Create/update agreement
- `POST /api/agreements/:householdId/sign` - Sign agreement
- `DELETE /api/agreements/:householdId/sign/:roommateId` - Remove signature

## Real-time Updates

The server uses Socket.io for real-time updates. Events include:

- `household-updated` - Household changes
- `roommate-created/updated/deleted` - Roommate changes
- `room-created/updated/deleted` - Room changes
- `expense-created/updated/deleted` - Expense changes
- `split-paid/unpaid` - Payment status changes
- `agreement-updated/signed` - Agreement changes
- `member-joined/removed` - Membership changes

## Features

### Authentication
- JWT-based authentication
- Password hashing with bcrypt
- Token expiration and refresh

### User Profiles
- Profile management
- Password changes
- Multiple household membership

### Households
- Create and manage households
- Invite system with codes
- Member roles (owner, admin, member)
- Activity logging

### Real-time Sync
- Live updates across devices
- Socket.io rooms per household
- Automatic reconnection

## Troubleshooting

### Database Connection Issues
- Check MySQL is running: `sudo systemctl status mysql`
- Verify credentials in `.env`
- Ensure database exists: `mysql -u root -p -e "SHOW DATABASES;"`

### Server Won't Start
- Check port 3001 is available
- Verify all dependencies installed
- Check logs for specific errors

### CORS Errors
- Update `FRONTEND_URL` in `.env` to match your frontend URL
- Ensure both servers are running

## Production Deployment

For production:

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Configure SSL/TLS
4. Use connection pooling
5. Set up database backups
6. Configure proper CORS origins
