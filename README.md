# API Cost Tracker

A lightweight, progressive web application (PWA) for tracking AI API costs across **OpenAI, Anthropic (Claude), Google Gemini, and Perplexity** services. Monitor token usage, calculate costs locally, set spending alerts, and gain real-time visibility into your API expenses.

![API Cost Tracker](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Features

- **Multi-Provider Support**: Track usage across OpenAI (GPT-4, GPT-3.5), Anthropic (Claude), Google Gemini, and Perplexity
- **Token-Based Cost Tracking**: Fetch token usage and calculate costs using built-in pricing database (updated for Nov 2025)
- **Multi-Key Management**: Securely store and track multiple API keys with AES-256 encryption
- **Real-Time Monitoring**: Automated polling jobs fetch usage data every 5-15 minutes
- **Smart Cost Calculation**: Local cost computation from token usage with support for input/output tokens and caching
- **Unified Dashboard**: Card-based layout showing MTD spend, daily averages, and trends by model
- **Usage Analytics**: Interactive time-series charts with 7/30/90-day views, per-model breakdown
- **Email Alerts**: Configurable spending thresholds with SMTP email notifications (daily/monthly)
- **PWA Support**: Install to home screen, works offline with cached data
- **Dark/Light Mode**: Respects system preferences with manual toggle
- **Secure**: AES-256 encryption for API keys, rate limiting, CORS protection, Helmet security headers

## Provider Support Status

| Provider | Usage Tracking | Cost Calculation | Notes |
|----------|----------------|------------------|-------|
| **OpenAI** | ✅ Full | ✅ Automatic | Uses Organization Usage API |
| **Anthropic** | ✅ Full | ✅ Automatic | Requires Admin API key |
| **Gemini** | ⚠️ Limited | ✅ Manual | No usage API; track via Google Cloud Console |
| **Perplexity** | ⚠️ Limited | ✅ Manual | No usage API; check dashboard at perplexity.ai/settings/api |

**Note**: For Gemini and Perplexity, automated polling will validate keys but cannot fetch historical usage data. You'll need to manually enter usage or check their respective dashboards.

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
3. Select provider:
   - **OpenAI (GPT-4, GPT-3.5)** - Requires standard API key
   - **Anthropic (Claude)** - Requires Admin API key for usage tracking
   - **Google (Gemini)** - Requires Gemini API key
   - **Perplexity** - Requires Perplexity API key
4. Paste your API key (it will be validated and encrypted)
5. Optionally add a workspace name

**Important**: For Anthropic, use an [Admin API key](https://docs.claude.com/en/api/admin-api) to enable automated usage tracking. Regular API keys will validate but won't fetch usage data.

### Viewing Usage

- **Dashboard Cards**: Each card shows MTD spend, daily average, and trend by model
- **Time-Series Charts**: Click the expand arrow on any card to view detailed usage over time
- **Time Ranges**: Switch between 7, 30, or 90-day views
- **Model Breakdown**: View cost breakdown by specific model (GPT-4, Claude Sonnet, etc.)
- **Token Details**: See input tokens, output tokens, and cached tokens separately

### How Cost Calculation Works

The app uses a **token-based cost tracking approach**:

1. **Fetch Usage Data**: Automated polling retrieves token usage from provider APIs
   - OpenAI: Organization Usage API (input/output/cached tokens)
   - Anthropic: Admin API (uncached/cached input, output, cache creation tokens)
   - Gemini & Perplexity: Key validation only (manual tracking required)

2. **Local Cost Calculation**: Costs are computed using built-in pricing data
   - Input tokens × Input price per million
   - Output tokens × Output price per million
   - Pricing database updated for November 2025 rates

3. **Storage**: Token counts and calculated costs stored in MySQL
   - Separate tracking of input/output/cached tokens
   - Per-model breakdown
   - Daily snapshots for historical analysis

**Benefits**:
- ✅ Works even if providers don't offer billing APIs
- ✅ Transparent pricing (see `backend/src/config/pricing.ts`)
- ✅ Accurate per-model cost attribution
- ✅ Support for caching discounts (Anthropic prompt caching)

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
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=api_cost_tracker
DB_PASSWORD=your_password
DB_NAME=api_cost_tracker

# Security
ENCRYPTION_KEY=your_32_char_key  # Generate with: openssl rand -hex 16
ALLOWED_ORIGINS=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Polling
POLL_INTERVAL_MINUTES=5

# Email Notifications (Optional - leave blank to disable)
SMTP_HOST=smtp.gmail.com         # Your SMTP server
SMTP_PORT=587                     # SMTP port (587 for TLS, 465 for SSL)
SMTP_SECURE=false                 # true for port 465, false for other ports
SMTP_USER=your-email@gmail.com    # SMTP username
SMTP_PASS=your-app-password       # SMTP password (use app-specific password for Gmail)
SMTP_FROM=API Cost Tracker <your-email@gmail.com>  # From address
```

**Email Setup Notes:**
- For Gmail: Use an [app-specific password](https://support.google.com/accounts/answer/185833)
- For SendGrid: Use your SendGrid API key as the password
- For custom SMTP: Contact your email provider for settings

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

### Completed (v1.1 - November 2025)
- [x] Support for 4 AI providers (OpenAI, Anthropic, Gemini, Perplexity)
- [x] Token-based cost tracking with local calculation
- [x] Email notification support for spending alerts
- [x] Detailed token breakdown (input/output/cached tokens)
- [x] Per-model cost calculation

### Planned Features
- [ ] CSV/JSON export of usage data
- [ ] Team/organization support with user roles
- [ ] Budget forecasting and recommendations
- [ ] Full usage tracking for Gemini and Perplexity (pending API availability)
- [ ] Integration with more AI providers (Cohere, Hugging Face, Mistral)
- [ ] Mobile native apps (React Native)
- [ ] Webhook support for external integrations
- [ ] Advanced analytics and spending insights
- [ ] Custom pricing tiers and volume discounts

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
