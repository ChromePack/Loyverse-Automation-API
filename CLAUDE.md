# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Installation and Setup
```bash
yarn install                    # Install dependencies (required - use yarn, not npm)
```

### Running the Application
```bash
yarn start                     # Production server (node src/server.js)
yarn dev                      # Development server with auto-reload (nodemon)
```

### Testing Commands
```bash
yarn test                     # Run browser launch test
yarn test:browser            # Test browser functionality
yarn test:extension          # Test extension functionality
yarn test:simple             # Run simple browser test
```

### Code Quality Commands
```bash
yarn lint                     # Run ESLint
yarn lint:fix                # Auto-fix ESLint issues
yarn format                  # Format code with Prettier
yarn format:check            # Check code formatting
```

### Utility Commands
```bash
yarn clear-session           # Clear browser session data
yarn setup:vps               # Run VPS setup script
yarn deploy                  # Deploy to production server using PM2
```

## Architecture Overview

This is a **Loyverse POS Automation API** built with Express.js and Puppeteer for web scraping Loyverse sales data.

### Core Components

**Browser Management**
- `BrowserService` - Manages Puppeteer browser lifecycle with enhanced anti-detection
- Includes 2captcha integration for CAPTCHA handling
- Persistent user data directory for session management
- Headless/headed mode detection based on environment

**Authentication & Navigation**
- `AuthService` - Handles Loyverse login with human-like behavior patterns
- `NavigationService` - Manages page navigation and data extraction workflows
- Enhanced anti-detection measures including realistic user agents and headers

**Data Processing Pipeline**
- `CsvParserService` - Parses downloaded CSV files from Loyverse
- `DataExtractionService` - Orchestrates complete extraction workflow
- `ValidationService` - Validates extracted sales data
- `AggregationService` - Aggregates data across multiple stores

**API Structure**
- RESTful Express API with comprehensive middleware
- Sales endpoints for data extraction
- Health check and monitoring endpoints
- n8n webhook integration for automation workflows

### Data Models
- `Store` - Predefined store configurations
- `SalesItem` - Standardized sales data structure

### Key Workflow
1. Launch browser with anti-detection measures
2. Authenticate with Loyverse using human-like patterns
3. Navigate to goods reports section
4. Apply date filters and select specific stores
5. Handle any CAPTCHAs using 2captcha service
6. Export CSV data for each store
7. Parse, validate, and aggregate data
8. Return structured JSON response

## Configuration

### Environment Variables
- Browser runs in headless mode on servers (Linux without DISPLAY)
- Chrome executable path auto-detection for Ubuntu
- Download and user data directories are configurable
- Webhook integration enabled by default

### Browser Configuration
- Puppeteer with stealth plugin for detection avoidance
- 2captcha service integration for CAPTCHA handling
- Persistent Chrome user data for session management
- Custom Chrome flags for stability and performance

## Security Considerations

- Hardcoded Loyverse credentials in config (consider moving to env vars)
- Enhanced anti-bot detection measures
- Request size limits and basic security headers
- CORS enabled for n8n integration

## Code Style Guidelines

Per `.cursorrules`:
- Use yarn for dependency management
- Apply Clean Code principles (Robert C. Martin)
- All comments and documentation in English
- Test files go in `/test` folder
- Start responses with 👨‍💻 emoji when appropriate

## Testing Strategy

- Browser launch verification tests
- Extension functionality validation
- Simple browser automation tests
- Tests validate Chrome installation and extension loading

## Deployment

### VPS Deployment with PM2 and VNC

**Server**: ssh root@72.60.32.173

**Quick Setup**:
```bash
# 1. Initial VPS setup (run on server)
./setup-vps.sh

# 2. Deploy application (run locally)
./deploy-vps.sh
```

**Key Features**:
- PM2 process management with auto-restart
- VNC server for remote desktop viewing (:5901)
- Xvfb virtual display (:1) for headless browser automation
- Chrome with extension support
- Automated deployment with git integration

**VNC Access**:
- Connect to: 72.60.32.173:5901
- Default password: loyverse123 (change this!)
- Resolution: 1920x1080x24

**PM2 Commands**:
```bash
pm2 status                    # Check application status
pm2 logs loyverse-automation-api  # View logs
pm2 restart loyverse-automation-api  # Restart app
pm2 monit                     # Real-time monitoring
```

See `DEPLOYMENT.md` for detailed setup instructions.

## Integration Points

- **n8n Workflows**: Webhook endpoint for automation triggers
- **CSV Export**: Loyverse native export functionality
- **File System**: Downloads directory for CSV processing
- **Logging**: Structured logging with request tracking
- **VPS Deployment**: PM2 + VNC for production hosting