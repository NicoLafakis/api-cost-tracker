# API Cost Tracker

A lightweight, progressive web application (PWA) for tracking AI API costs across OpenAI and Anthropic (Claude) services. Monitor usage, set spending alerts, and gain real-time visibility into your API expenses.

![API Cost Tracker](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Features

- **Multi-Key Management**: Securely store and track multiple API keys from OpenAI and Anthropic
- **Real-Time Monitoring**: Automated polling jobs fetch usage data every 5-15 minutes
- **Unified Dashboard**: Card-based layout showing MTD spend, daily averages, and trends
- **Usage Analytics**: Interactive time-series charts with 7/30/90-day views
- **Spending Alerts**: Configurable thresholds with email notifications
- **PWA Support**: Install to home screen, works offline with cached data
- **Dark/Light Mode**: Respects system preferences with manual toggle
- **Secure**: AES-256 encryption for API keys, rate limiting, CORS protection

## Architecture

### Tech Stack

**Frontend:**
- React 18 with TypeScript
- Tailwind CSS for styling
- Recharts for data visualization
- Vite for blazing-fast builds
- PWA with Workbox service worker

**Backend:**
- Node.js with Express
- TypeScript
- MySQL for data storage
- Automated polling with node-cron
- Helmet + CORS for security

**Deployment:**
- Docker & Docker Compose
- Nginx reverse proxy for frontend
- Horizontal scaling support

## Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- MySQL 8.0+
- Docker (optional, for containerized deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/api-cost-tracker.git
   cd api-cost-tracker
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set:
   - `ENCRYPTION_KEY`: 32-character encryption key (generate with `openssl rand -hex 16`)
   - `DB_PASSWORD`: Secure MySQL password
   - Other settings as needed

3. **Option A: Docker Compose (Recommended)**
   ```bash
   docker-compose up -d
   ```

   The application will be available at:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

4. **Option B: Manual Setup**

   **Database Setup:**
   ```bash
   mysql -u root -p
   CREATE DATABASE api_cost_tracker;
   CREATE USER 'api_cost_tracker'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON api_cost_tracker.* TO 'api_cost_tracker'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

   **Backend Setup:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your database credentials
   npm install
   npm run migrate    # Run database migrations
   npm run dev        # Start development server
   ```

   **Frontend Setup:**
   ```bash
   cd frontend
   cp .env.example .env
   npm install
   npm run dev        # Start development server
   ```

## Usage

### Adding API Keys

1. Click **"Add API Key"** in the header
2. Enter a descriptive label (e.g., "Production", "Development")
3. Select provider (OpenAI or Anthropic)
4. Paste your API key (it will be validated and encrypted)
5. Optionally add a workspace name

### Viewing Usage

- **Dashboard Cards**: Each card shows MTD spend, daily average, and trend
- **Time-Series Charts**: Click the expand arrow on any card to view detailed usage over time
- **Time Ranges**: Switch between 7, 30, or 90-day views

### Setting Up Alerts

1. Click the **bell icon** in the header
2. Click **"Add New Alert"**
3. Select an API key
4. Set threshold amount and period (daily/monthly)
5. Optionally add an email for notifications

### Dark Mode

Click the theme icon in the header to cycle between:
- Light mode ☀️
- Dark mode 🌙
- System preference 💻

## API Endpoints

### API Keys
- `GET /api/keys` - List all API keys
- `POST /api/keys` - Add new API key
- `PATCH /api/keys/:id` - Update key label/workspace
- `DELETE /api/keys/:id` - Deactivate key
- `POST /api/keys/:id/validate` - Revalidate key

### Usage Data
- `GET /api/usage/dashboard?timeRange=30d` - Dashboard data
- `GET /api/usage/timeseries/:keyId?days=30` - Time-series data
- `GET /api/usage/compare?keyIds=1,2&days=30` - Compare multiple keys
- `GET /api/usage/models/:keyId?days=30` - Model breakdown

### Alerts
- `GET /api/alerts` - List all alerts
- `POST /api/alerts` - Create alert
- `PATCH /api/alerts/:id` - Update alert
- `DELETE /api/alerts/:id` - Delete alert

### Preferences
- `GET /api/preferences` - Get all preferences
- `PUT /api/preferences/:key` - Update preference

## Configuration

### Backend Environment Variables

```env
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=api_cost_tracker
DB_PASSWORD=your_password
DB_NAME=api_cost_tracker
ENCRYPTION_KEY=your_32_char_key
POLL_INTERVAL_MINUTES=5
ALLOWED_ORIGINS=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Environment Variables

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

## Development

### Project Structure

```
api-cost-tracker/
├── backend/
│   ├── src/
│   │   ├── database/          # Schema and migrations
│   │   ├── routes/            # Express routes
│   │   ├── services/          # API clients and polling
│   │   ├── utils/             # Encryption helpers
│   │   └── index.ts           # Main server file
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── contexts/          # React contexts
│   │   ├── services/          # API service layer
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
└── docker-compose.yml
```

### Running Tests

```bash
# Backend tests (TODO)
cd backend
npm test

# Frontend tests (TODO)
cd frontend
npm test
```

### Building for Production

```bash
# Build backend
cd backend
npm run build

# Build frontend
cd frontend
npm run build

# Or use Docker Compose
docker-compose -f docker-compose.yml build
```

## Security Considerations

1. **API Key Storage**: All API keys are encrypted with AES-256 before storage
2. **Environment Variables**: Never commit `.env` files
3. **ENCRYPTION_KEY**: Generate a strong 32-character key and keep it secure
4. **Rate Limiting**: API endpoints are rate-limited to prevent abuse
5. **CORS**: Configure `ALLOWED_ORIGINS` to restrict frontend access
6. **HTTPS**: Use HTTPS in production (configure via reverse proxy)

## Deployment

### Production Checklist

- [ ] Set strong `ENCRYPTION_KEY` (32 characters)
- [ ] Configure secure database password
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper `ALLOWED_ORIGINS`
- [ ] Set up HTTPS with SSL certificates
- [ ] Configure automated backups for MySQL
- [ ] Set up monitoring and logging
- [ ] Review rate limit settings

### Recommended Hosting

- **Frontend**: Vercel, Netlify, Cloudflare Pages
- **Backend**: Railway, Render, Fly.io, DigitalOcean
- **Database**: PlanetScale, AWS RDS, DigitalOcean Managed MySQL

## Troubleshooting

### Database Connection Issues

```bash
# Check MySQL is running
mysql -u root -p -e "SELECT 1"

# Verify credentials
mysql -u api_cost_tracker -p api_cost_tracker
```

### Polling Not Working

- Check backend logs for errors
- Verify API keys are valid using `/api/keys/:id/validate`
- Ensure `POLL_INTERVAL_MINUTES` is set correctly

### PWA Not Installing

- Ensure HTTPS is enabled (required for PWA)
- Check browser console for service worker errors
- Verify manifest.json is accessible

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Roadmap

- [ ] Email notification support for alerts
- [ ] CSV/JSON export of usage data
- [ ] Team/organization support with user roles
- [ ] Budget forecasting and recommendations
- [ ] Integration with more AI providers (Cohere, Hugging Face)
- [ ] Mobile native apps (React Native)
- [ ] Webhook support for external integrations

## Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Email: support@example.com

## Acknowledgments

- Built with React, Express, and MySQL
- Inspired by the need for better API cost visibility
- Thanks to the open-source community

---

**Made with ❤️ for developers managing AI API costs**
