# Backend API Requirements Document
## Loyverse POS Data Extraction API

**Document Version:** 1.0  
**Date:** January 2025  
**Focus:** Backend API & Puppeteer Automation

---

## Table of Contents
1. [Overview](#overview)
2. [API Endpoints](#api-endpoints)
3. [Puppeteer Automation Flow](#puppeteer-automation-flow)
4. [Data Models](#data-models)
5. [CSV Processing Logic](#csv-processing-logic)
6. [Error Handling](#error-handling)
7. [Environment Configuration](#environment-configuration)

---

## 1. Overview {#overview}

### 1.1 Purpose
Develop a Node.js/Express API that uses Puppeteer to automate data extraction from Loyverse POS system via CSV downloads.

### 1.2 Core Functionality
- Automate login to Loyverse POS dashboard
- Navigate to Sales by Item report
- Iterate through 5 store branches
- Download CSV files for each store
- Process and return structured data

### 1.3 Technology Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Automation:** Puppeteer
- **CSV Parsing:** csv-parser
- **File System:** fs/promises

---

## 2. API Endpoints {#api-endpoints}

### 2.1 Extract Daily Sales
**Endpoint:** `POST /api/extract-daily-sales`

**Request Body:**
```json
{
  "date": "2025-01-15",  // Optional, defaults to today
  "stores": ["all"]      // Optional, array of store names or "all"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "extraction_date": "2025-01-15",
    "stores": [
      {
        "store_name": "Apung Iska - MAT",
        "items_count": 145,
        "total_sales": 25750.50,
        "items": [
          {
            "date_sold": "2025-01-15",
            "store_branch": "Apung Iska - MAT",
            "item_name": "Coffee Latte",
            "category": "Beverages",
            "items_sold": 25,
            "gross_sales": 1250.50
          }
        ]
      }
    ]
  }
}
```

### 2.2 Extract Single Store
**Endpoint:** `POST /api/extract-store`

**Request Body:**
```json
{
  "store_name": "Apung Iska - MAT",
  "date": "2025-01-15"
}
```

**Response:** Same structure as above but with single store data

### 2.3 Health Check
**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T15:00:00Z"
}
```

---

## 3. Puppeteer Automation Flow {#puppeteer-automation-flow}

### 3.1 Main Automation Steps

```javascript
// Pseudo-code flow
1. Launch browser (headless: true)
2. Navigate to r.loyverse.com
3. Login with credentials
4. Navigate to Reports → Sales by Item
5. For each store:
   a. Select store from dropdown
   b. Handle page refresh
   c. Set date filter
   d. Click export/download button
   e. Wait for CSV download
   f. Move CSV to processing directory
6. Close browser
7. Process all CSV files
8. Return structured data
```

### 3.2 Key Selectors & Navigation
- **Login Form:** Username and password fields
- **Reports Menu:** Navigate to Sales by Item section
- **Store Selector:** Dropdown with store branches
- **Date Filter:** Date picker for report range
- **Export Button:** CSV download trigger

### 3.3 Download Handling
- Configure Puppeteer download path
- Monitor download completion
- Handle file naming conventions
- Move completed files for processing

---

## 4. Data Models {#data-models}

### 4.1 Store Configuration
```javascript
const STORES = [
  "Apung Iska - MAT",
  "Store 2",
  "Store 3", 
  "Store 4",
  "Store 5"
];
```

### 4.2 Processed Item Structure
```javascript
{
  date_sold: String,      // Format: YYYY-MM-DD
  store_branch: String,   // Store name
  item_name: String,      // Product name
  category: String,       // Product category
  items_sold: Number,     // Quantity
  gross_sales: Number     // Sales amount
}
```

### 4.3 CSV Column Mapping
```javascript
const CSV_COLUMNS = {
  'Item Name': 'item_name',
  'Category': 'category',
  'Items Sold': 'items_sold',
  'Gross Sales': 'gross_sales'
};
```

---

## 5. CSV Processing Logic {#csv-processing-logic}

### 5.1 File Processing Flow
1. **Read CSV File:** Use fs.createReadStream
2. **Parse with csv-parser:** Handle headers and data rows
3. **Transform Data:** Add metadata (date, store)
4. **Validate Records:** Ensure required fields exist
5. **Clean Up:** Delete temporary CSV files

### 5.2 Data Transformation
```javascript
// Add metadata to each row
row.date_sold = extractionDate;
row.store_branch = currentStore;
row.items_sold = parseInt(row.items_sold);
row.gross_sales = parseFloat(row.gross_sales);
```

### 5.3 File Management
- **Download Directory:** `./downloads/`
- **Processing Directory:** `./processing/`
- **Cleanup:** Remove files after successful processing

---

## 6. Error Handling {#error-handling}

### 6.1 Error Types
| Error Type | Description | Response Code |
|------------|-------------|---------------|
| LOGIN_FAILED | Invalid credentials or login page changed | 401 |
| NAVIGATION_ERROR | Unable to find expected elements | 500 |
| DOWNLOAD_TIMEOUT | CSV download didn't complete | 504 |
| PARSE_ERROR | CSV file corrupted or invalid format | 422 |
| STORE_NOT_FOUND | Requested store not in list | 404 |

### 6.2 Retry Logic
- **Max Retries:** 3 attempts
- **Retry Delay:** 5 seconds between attempts
- **Timeout Settings:** 30 seconds for downloads

### 6.3 Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "DOWNLOAD_TIMEOUT",
    "message": "CSV download timed out for store: Apung Iska - MAT",
    "timestamp": "2025-01-15T15:00:00Z"
  }
}
```

---

## 7. Environment Configuration {#environment-configuration}

### 7.1 Required Environment Variables
```env
# Loyverse Credentials
LOYVERSE_USERNAME=your_username
LOYVERSE_PASSWORD=your_password

# API Configuration  
PORT=3000
NODE_ENV=production

# Puppeteer Settings
PUPPETEER_HEADLESS=true
DOWNLOAD_TIMEOUT=30000
NAVIGATION_TIMEOUT=30000

# File Paths
DOWNLOAD_PATH=./downloads
PROCESSING_PATH=./processing
```

### 7.2 Puppeteer Launch Configuration
```javascript
{
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  defaultViewport: { width: 1920, height: 1080 }
}
```

### 7.3 Express Server Setup
- **Body Parser:** JSON request handling
- **CORS:** Enabled for n8n integration
- **Port:** Configurable via environment variable
- **Error Middleware:** Global error handling

---

## API Usage Examples

### Example 1: Extract All Stores
```bash
curl -X POST http://localhost:3000/api/extract-daily-sales \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-01-15"}'
```

### Example 2: Extract Specific Store
```bash
curl -X POST http://localhost:3000/api/extract-store \
  -H "Content-Type: application/json" \
  -d '{"store_name": "Apung Iska - MAT", "date": "2025-01-15"}'
```

### Example 3: Health Check
```bash
curl http://localhost:3000/api/health
```

---

## Implementation Notes

### Browser Automation Considerations
- Handle dynamic page loads with proper wait conditions
- Use explicit waits rather than fixed delays
- Implement screenshot capture for debugging
- Handle session timeouts gracefully

### CSV Processing Considerations
- Support various CSV encodings (UTF-8, ISO-8859-1)
- Handle empty rows and malformed data
- Implement streaming for large files
- Validate numeric fields

### Performance Optimization
- Reuse browser instance for multiple stores
- Process stores sequentially to avoid conflicts
- Implement connection pooling
- Clean up resources properly

---

## 8. Step-by-Step Implementation Plan {#implementation-plan}

### Phase 1: Project Setup & Foundation

#### Task 1.1: Initialize Project Structure
**Subtasks:**
- [ ] Create project directory structure
  - [ ] Create `src/` directory for source code
  - [ ] Create `src/controllers/` for API route handlers
  - [ ] Create `src/services/` for business logic
  - [ ] Create `src/models/` for data models
  - [ ] Create `src/utils/` for utility functions
  - [ ] Create `src/middleware/` for Express middleware
  - [ ] Create `src/config/` for configuration files
  - [ ] Create `downloads/` and `processing/` directories

#### Task 1.2: Package Management & Dependencies
**Subtasks:**
- [ ] Initialize package.json with `yarn init`
- [ ] Install core dependencies:
  - [ ] `express` - Web framework
  - [ ] `puppeteer` - Browser automation
  - [ ] `csv-parser` - CSV processing
  - [ ] `dotenv` - Environment variables
  - [ ] `cors` - Cross-origin resource sharing
  - [ ] `helmet` - Security middleware
  - [ ] `morgan` - HTTP request logger
- [ ] Install development dependencies:
  - [ ] `eslint` - Code linting
  - [ ] `prettier` - Code formatting
  - [ ] `nodemon` - Development server
  - [ ] `@types/node` - TypeScript definitions

#### Task 1.3: Configuration Setup
**Subtasks:**
- [ ] Create `.env.example` file with all required variables
- [ ] Create `.env` file for local development
- [ ] Set up ESLint configuration with clean code rules
- [ ] Set up Prettier configuration
- [ ] Create `.gitignore` file

---

### Phase 2: Core Infrastructure Development

#### Task 2.1: Express Server Setup
**Subtasks:**
- [ ] Create `src/app.js` - Main Express application
  - [ ] Configure middleware (helmet, cors, morgan, body-parser)
  - [ ] Set up route handlers
  - [ ] Implement global error handling middleware
  - [ ] Add request validation middleware
- [ ] Create `src/server.js` - Server startup logic
  - [ ] Environment variable validation
  - [ ] Graceful shutdown handling
  - [ ] Port configuration
- [ ] Create `src/config/index.js` - Centralized configuration
  - [ ] Environment-specific settings
  - [ ] Puppeteer configuration
  - [ ] File path configurations

#### Task 2.2: Data Models & Constants
**Subtasks:**
- [ ] Create `src/models/Store.js` - Store data model
  - [ ] Store configuration array
  - [ ] Store validation functions
  - [ ] Store name mapping utilities
- [ ] Create `src/models/SalesItem.js` - Sales item data model
  - [ ] Item structure definition
  - [ ] Data validation methods
  - [ ] Type conversion utilities
- [ ] Create `src/constants/index.js` - Application constants
  - [ ] CSV column mappings
  - [ ] Error codes and messages
  - [ ] Timeout configurations

#### Task 2.3: Utility Functions
**Subtasks:**
- [ ] Create `src/utils/fileManager.js` - File operations
  - [ ] Directory creation functions
  - [ ] File cleanup utilities
  - [ ] Download path management
- [ ] Create `src/utils/dateUtils.js` - Date manipulation
  - [ ] Date formatting functions
  - [ ] Date validation utilities
  - [ ] Default date handling
- [ ] Create `src/utils/logger.js` - Logging utilities
  - [ ] Structured logging setup
  - [ ] Log level configuration
  - [ ] Error logging functions

---

### Phase 3: Puppeteer Automation Implementation

#### Task 3.1: Browser Management Service
**Subtasks:**
- [ ] Create `src/services/BrowserService.js` - Browser lifecycle management
  - [ ] Browser launch configuration
  - [ ] Browser instance management
  - [ ] Page creation and cleanup
  - [ ] Error handling for browser operations
- [ ] Implement browser launch options
  - [ ] Headless mode configuration
  - [ ] Viewport settings
  - [ ] Chrome arguments setup
- [ ] Add download configuration
  - [ ] Download path setup
  - [ ] Download behavior settings
  - [ ] File completion monitoring

#### Task 3.2: Loyverse Authentication Service
**Subtasks:**
- [ ] Create `src/services/AuthService.js` - Authentication logic
  - [ ] Login page navigation
  - [ ] Credential input automation
  - [ ] Login success verification
  - [ ] Session management
- [ ] Implement element selectors
  - [ ] Username field selector
  - [ ] Password field selector
  - [ ] Login button selector
  - [ ] Error message selectors
- [ ] Add authentication error handling
  - [ ] Invalid credentials detection
  - [ ] Network timeout handling
  - [ ] Captcha detection (if applicable)

#### Task 3.3: Navigation Service
**Subtasks:**
- [ ] Create `src/services/NavigationService.js` - Page navigation logic
  - [ ] Reports menu navigation
  - [ ] Sales by Item page navigation
  - [ ] Store selection automation
  - [ ] Date filter configuration
- [ ] Implement dynamic waiting strategies
  - [ ] Element visibility waiting
  - [ ] Page load completion
  - [ ] AJAX request completion
- [ ] Add navigation error handling
  - [ ] Element not found errors
  - [ ] Timeout errors
  - [ ] Page structure changes

#### Task 3.4: Data Extraction Service
**Subtasks:**
- [ ] Create `src/services/ExtractionService.js` - Main extraction orchestrator
  - [ ] Multi-store extraction flow
  - [ ] Single store extraction
  - [ ] Progress tracking
  - [ ] Error recovery mechanisms
- [ ] Implement store iteration logic
  - [ ] Store dropdown selection
  - [ ] Page refresh handling
  - [ ] Date range setting
  - [ ] CSV download triggering
- [ ] Add download monitoring
  - [ ] Download completion detection
  - [ ] File naming verification
  - [ ] Download timeout handling

---

### Phase 4: CSV Processing Implementation

#### Task 4.1: CSV Parser Service
**Subtasks:**
- [ ] Create `src/services/CsvParserService.js` - CSV processing logic
  - [ ] Stream-based CSV reading
  - [ ] Header validation
  - [ ] Data transformation pipeline
  - [ ] Error handling for malformed data
- [ ] Implement data transformation
  - [ ] Column mapping application
  - [ ] Data type conversion
  - [ ] Metadata addition (date, store)
  - [ ] Data validation
- [ ] Add encoding support
  - [ ] UTF-8 encoding handling
  - [ ] ISO-8859-1 encoding support
  - [ ] Encoding detection

#### Task 4.2: Data Validation Service
**Subtasks:**
- [ ] Create `src/services/ValidationService.js` - Data validation
  - [ ] Required field validation
  - [ ] Numeric field validation
  - [ ] Date format validation
  - [ ] Store name validation
- [ ] Implement validation rules
  - [ ] Item name validation
  - [ ] Category validation
  - [ ] Sales amount validation
  - [ ] Quantity validation
- [ ] Add error reporting
  - [ ] Validation error collection
  - [ ] Error message formatting
  - [ ] Invalid record logging

#### Task 4.3: Data Aggregation Service
**Subtasks:**
- [ ] Create `src/services/AggregationService.js` - Data aggregation
  - [ ] Store-level aggregation
  - [ ] Total sales calculation
  - [ ] Item count calculation
  - [ ] Summary statistics
- [ ] Implement data structuring
  - [ ] Response format preparation
  - [ ] Data grouping by store
  - [ ] Metadata inclusion
- [ ] Add performance optimization
  - [ ] Memory-efficient processing
  - [ ] Streaming aggregation
  - [ ] Lazy evaluation

---

### Phase 5: API Controllers & Routes

#### Task 5.1: Sales Extraction Controller
**Subtasks:**
- [ ] Create `src/controllers/SalesController.js` - Main sales operations
  - [ ] Extract daily sales endpoint handler
  - [ ] Extract single store endpoint handler
  - [ ] Request validation
  - [ ] Response formatting
- [ ] Implement request processing
  - [ ] Parameter extraction
  - [ ] Default value handling
  - [ ] Input sanitization
- [ ] Add response handling
  - [ ] Success response formatting
  - [ ] Error response formatting
  - [ ] Status code management

#### Task 5.2: Health Check Controller
**Subtasks:**
- [ ] Create `src/controllers/HealthController.js` - Health monitoring
  - [ ] Basic health check endpoint
  - [ ] System status validation
  - [ ] Dependency health checks
- [ ] Implement health checks
  - [ ] File system access check
  - [ ] Browser availability check
  - [ ] Memory usage monitoring
- [ ] Add monitoring metrics
  - [ ] Response time tracking
  - [ ] Error rate monitoring
  - [ ] Resource usage metrics

#### Task 5.3: Route Configuration
**Subtasks:**
- [ ] Create `src/routes/index.js` - Main router configuration
  - [ ] Route registration
  - [ ] Middleware application
  - [ ] Error handling setup
- [ ] Create `src/routes/sales.js` - Sales routes
  - [ ] POST /api/extract-daily-sales
  - [ ] POST /api/extract-store
  - [ ] Route-specific middleware
- [ ] Create `src/routes/health.js` - Health routes
  - [ ] GET /api/health
  - [ ] Monitoring endpoints

---

### Phase 6: Error Handling & Middleware

#### Task 6.1: Error Handling Middleware
**Subtasks:**
- [ ] Create `src/middleware/errorHandler.js` - Global error handling
  - [ ] Error classification
  - [ ] Error response formatting
  - [ ] Error logging
  - [ ] Stack trace handling
- [ ] Implement error types
  - [ ] Validation errors
  - [ ] Authentication errors
  - [ ] Timeout errors
  - [ ] System errors
- [ ] Add error recovery
  - [ ] Retry mechanisms
  - [ ] Fallback strategies
  - [ ] Graceful degradation

#### Task 6.2: Validation Middleware
**Subtasks:**
- [ ] Create `src/middleware/validation.js` - Request validation
  - [ ] Schema validation
  - [ ] Parameter validation
  - [ ] Type checking
  - [ ] Range validation
- [ ] Implement validation schemas
  - [ ] Date validation schema
  - [ ] Store name validation
  - [ ] Request body validation
- [ ] Add validation error handling
  - [ ] Error message formatting
  - [ ] Field-specific errors
  - [ ] Multiple error aggregation

#### Task 6.3: Security Middleware
**Subtasks:**
- [ ] Create `src/middleware/security.js` - Security measures
  - [ ] Rate limiting
  - [ ] Input sanitization
  - [ ] CORS configuration
  - [ ] Security headers
- [ ] Implement security checks
  - [ ] Request size limits
  - [ ] File type validation
  - [ ] Path traversal prevention
- [ ] Add monitoring
  - [ ] Security event logging
  - [ ] Attack detection
  - [ ] Abuse prevention

---

### Phase 7: Documentation & Deployment

#### Task 7.1: Code Documentation
**Subtasks:**
- [ ] Add JSDoc comments to all functions
  - [ ] Parameter documentation
  - [ ] Return value documentation
  - [ ] Usage examples
- [ ] Create API documentation
  - [ ] Endpoint descriptions
  - [ ] Request/response examples
  - [ ] Error code documentation
- [ ] Add inline code comments
  - [ ] Complex logic explanation
  - [ ] Configuration explanations
  - [ ] Performance considerations

#### Task 7.2: Deployment Configuration
**Subtasks:**
- [ ] Create `Dockerfile` for containerization
  - [ ] Node.js base image
  - [ ] Dependency installation
  - [ ] Application setup
- [ ] Create `docker-compose.yml`
  - [ ] Service configuration
  - [ ] Environment variables
  - [ ] Volume mounting
- [ ] Create deployment scripts
  - [ ] Production deployment
  - [ ] Environment setup
  - [ ] Health check scripts

#### Task 7.3: Monitoring & Logging
**Subtasks:**
- [ ] Set up production logging
  - [ ] Structured logging format
  - [ ] Log rotation
  - [ ] Error alerting
- [ ] Add performance monitoring
  - [ ] Response time tracking
  - [ ] Memory usage monitoring
  - [ ] Error rate tracking
- [ ] Create maintenance scripts
  - [ ] Log cleanup
  - [ ] File cleanup
  - [ ] Health monitoring

---

### Phase 8: Quality Assurance & Optimization

#### Task 8.1: Code Quality Checks
**Subtasks:**
- [ ] Run ESLint on all source files
  - [ ] Fix linting errors
  - [ ] Ensure consistent formatting
  - [ ] Apply clean code principles
- [ ] Perform code review
  - [ ] Check for code smells
  - [ ] Verify error handling
  - [ ] Validate security measures
- [ ] Optimize performance
  - [ ] Identify bottlenecks
  - [ ] Optimize critical paths
  - [ ] Reduce memory usage

#### Task 8.2: Security Assessment
**Subtasks:**
- [ ] Vulnerability scanning
  - [ ] Dependency vulnerabilities
  - [ ] Code security issues
  - [ ] Configuration security
- [ ] Security hardening
  - [ ] Secure configurations
  - [ ] Access controls
  - [ ] Data protection

#### Task 8.3: Performance Optimization
**Subtasks:**
- [ ] Load testing
  - [ ] Concurrent request handling
  - [ ] Memory consumption
  - [ ] Response time analysis
- [ ] Performance optimization
  - [ ] Identify bottlenecks
  - [ ] Optimize critical paths
  - [ ] Reduce memory usage
- [ ] Optimization implementation
  - [ ] Caching strategies
  - [ ] Connection pooling
  - [ ] Resource optimization

---

### Phase 9: Production Readiness

#### Task 9.1: Production Configuration
**Subtasks:**
- [ ] Environment configuration
  - [ ] Production environment variables
  - [ ] Security configurations
  - [ ] Performance optimizations
- [ ] Database setup (if needed)
  - [ ] Connection configuration
  - [ ] Migration scripts
  - [ ] Backup strategies
- [ ] Monitoring setup
  - [ ] Application monitoring
  - [ ] Infrastructure monitoring
  - [ ] Alert configuration

#### Task 9.2: Deployment Validation
**Subtasks:**
- [ ] Staging environment validation
  - [ ] Full functionality validation
  - [ ] Performance validation
  - [ ] Security verification
- [ ] Production deployment
  - [ ] Deployment script execution
  - [ ] Health check validation
  - [ ] Rollback preparation
- [ ] Post-deployment monitoring
  - [ ] Error monitoring
  - [ ] Performance monitoring
  - [ ] User feedback collection

#### Task 9.3: Maintenance Planning
**Subtasks:**
- [ ] Create maintenance documentation
  - [ ] Troubleshooting guide
  - [ ] Common issues and solutions
  - [ ] Update procedures
- [ ] Set up monitoring alerts
  - [ ] Error rate thresholds
  - [ ] Performance degradation
  - [ ] Resource utilization
- [ ] Plan regular maintenance
  - [ ] Log rotation
  - [ ] Security updates
  - [ ] Performance optimization

---

## Implementation Timeline

### Week 1-2: Foundation
- Complete Phase 1 (Project Setup)
- Complete Phase 2 (Core Infrastructure)

### Week 3-4: Core Development
- Complete Phase 3 (Puppeteer Automation)
- Complete Phase 4 (CSV Processing)

### Week 5-6: API Development
- Complete Phase 5 (API Controllers)
- Complete Phase 6 (Error Handling)

### Week 7-8: Documentation & Quality
- Complete Phase 7 (Documentation & Deployment)
- Complete Phase 8 (Quality Assurance & Optimization)

### Week 9: Production Readiness
- Complete Phase 9 (Production Readiness)

---

## Success Criteria

### Technical Requirements
- [ ] All API endpoints functional and documented
- [ ] Puppeteer automation working reliably
- [ ] CSV processing handling all data formats
- [ ] Error handling covering all scenarios

### Quality Requirements
- [ ] Code follows clean code principles
- [ ] All linting rules passing
- [ ] Security vulnerabilities addressed
- [ ] Performance meets requirements
- [ ] Documentation complete and accurate

### Operational Requirements
- [ ] Production deployment successful
- [ ] Monitoring and alerting configured
- [ ] Maintenance procedures documented
- [ ] Backup and recovery tested
- [ ] Team training completed

---

**End of Document**