# Setup Guide

This guide will walk you through setting up the API Cost Tracker application step by step.

## Prerequisites

Ensure you have the following installed:

- **Node.js** (v18 or higher): [Download](https://nodejs.org/)
- **npm** (v9 or higher): Comes with Node.js
- **MySQL** (v8.0 or higher): [Download](https://dev.mysql.com/downloads/)
- **Docker & Docker Compose** (optional): [Download](https://www.docker.com/products/docker-desktop)

## Quick Setup with Docker (Recommended)

This is the easiest way to get started:

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd api-cost-tracker
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

3. **Generate encryption key**
   ```bash
   openssl rand -hex 16
   ```
   Copy the output and paste it as the `ENCRYPTION_KEY` value in `.env`

4. **Edit the `.env` file**
   - Set a strong `DB_PASSWORD`
   - Verify other settings match your preferences

5. **Start the application**
   ```bash
   docker-compose up -d
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Health Check: http://localhost:3001/health

7. **View logs**
   ```bash
   docker-compose logs -f
   ```

## Manual Setup (Without Docker)

### Step 1: Database Setup

1. **Install MySQL** if not already installed

2. **Login to MySQL**
   ```bash
   mysql -u root -p
   ```

3. **Create database and user**
   ```sql
   CREATE DATABASE api_cost_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'api_cost_tracker'@'localhost' IDENTIFIED BY 'your_secure_password';
   GRANT ALL PRIVILEGES ON api_cost_tracker.* TO 'api_cost_tracker'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

### Step 2: Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` file** with your database credentials:
   ```env
   PORT=3001
   NODE_ENV=development
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=api_cost_tracker
   DB_PASSWORD=your_secure_password
   DB_NAME=api_cost_tracker
   ENCRYPTION_KEY=your_32_character_key_here
   POLL_INTERVAL_MINUTES=5
   ALLOWED_ORIGINS=http://localhost:3000
   ```

5. **Generate encryption key**
   ```bash
   openssl rand -hex 16
   ```
   Add this to your `.env` as `ENCRYPTION_KEY`

6. **Run database migration**
   ```bash
   npm run migrate
   ```
   You should see: `✓ Database migration completed successfully`

7. **Start the backend server**
   ```bash
   npm run dev
   ```
   You should see: `✓ API Cost Tracker backend listening on port 3001`

### Step 3: Frontend Setup

1. **Open a new terminal** and navigate to frontend directory
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` file** (usually defaults are fine for local development):
   ```env
   VITE_API_BASE_URL=http://localhost:3001/api
   ```

5. **Start the frontend server**
   ```bash
   npm run dev
   ```
   You should see: `Local: http://localhost:3000/`

### Step 4: Verify Installation

1. **Open your browser** and go to http://localhost:3000

2. **Check backend health**
   Visit http://localhost:3001/health
   You should see: `{"status":"ok","timestamp":"..."}`

3. **Test adding an API key**
   - Click "Add API Key" in the header
   - Fill in the form with a test key
   - The backend will validate it before storing

## Post-Installation

### Adding Your First API Key

1. Get an API key from:
   - **OpenAI**: https://platform.openai.com/api-keys
   - **Anthropic**: https://console.anthropic.com/settings/keys

2. Click **"Add API Key"** in the application header

3. Fill in the form:
   - Label: e.g., "Production OpenAI"
   - Provider: Select OpenAI or Anthropic
   - API Key: Paste your key (will be validated)
   - Workspace: e.g., "Production" (optional)

4. Click **"Add Key"** - the key will be validated and encrypted before storage

### Setting Up Alerts

1. Click the **bell icon** (🔔) in the header

2. Click **"Add New Alert"**

3. Configure:
   - Select an API key
   - Set threshold amount (e.g., $10.00)
   - Choose period (daily or monthly)
   - Add email for notifications (optional)

4. Click **"Create Alert"**

### Customizing Polling Interval

Edit the `POLL_INTERVAL_MINUTES` in your backend `.env` file:
- Default: 5 minutes
- Recommended: 5-15 minutes
- Lower values = more frequent updates but more API calls

Restart the backend after changing this value.

## Troubleshooting

### Backend won't start

**Issue**: `Error: ENCRYPTION_KEY must be exactly 32 characters long`
- **Solution**: Generate a key with `openssl rand -hex 16` and add to `.env`

**Issue**: `Error: Access denied for user 'api_cost_tracker'@'localhost'`
- **Solution**: Verify MySQL credentials in `.env` match the database setup

### Frontend won't connect to backend

**Issue**: API requests failing with CORS errors
- **Solution**: Ensure `ALLOWED_ORIGINS` in backend `.env` includes `http://localhost:3000`

**Issue**: 404 errors on API calls
- **Solution**: Verify `VITE_API_BASE_URL` in frontend `.env` is correct

### Polling not working

**Issue**: No data appearing in dashboard
- **Solution**: Check backend logs for polling errors
- **Solution**: Verify API keys are valid using the validate button

### Docker issues

**Issue**: Container won't start
- **Solution**: Check logs with `docker-compose logs backend`
- **Solution**: Ensure `.env` file exists and is properly configured

**Issue**: Database connection failed
- **Solution**: Wait for MySQL to fully initialize (can take 30-60 seconds on first run)
- **Solution**: Check with `docker-compose logs mysql`

## Development Tips

### Hot Reload

Both frontend and backend support hot reload in development mode:
- Backend changes: Restart automatically with nodemon
- Frontend changes: Instant reload with Vite HMR

### Database GUI Tools

Use tools like MySQL Workbench or TablePlus to inspect the database:
- Host: localhost
- Port: 3306
- User: api_cost_tracker
- Database: api_cost_tracker

### API Testing

Use tools like Postman or curl to test API endpoints:

```bash
# Health check
curl http://localhost:3001/health

# Get API keys
curl http://localhost:3001/api/keys

# Get dashboard data
curl http://localhost:3001/api/usage/dashboard?timeRange=30d
```

## Next Steps

- Read the [README.md](README.md) for full documentation
- Check the API endpoints in the README
- Explore the codebase structure
- Consider setting up automated backups for production

## Getting Help

If you encounter issues not covered here:
1. Check the main [README.md](README.md)
2. Review backend logs: `docker-compose logs backend` or console output
3. Review frontend logs: Browser DevTools console
4. Open an issue on GitHub with error details

Happy tracking! 🚀
