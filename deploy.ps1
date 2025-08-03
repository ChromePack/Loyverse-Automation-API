# Google Cloud Deployment Script for Loyverse Automation API

Write-Host "🚀 Starting Google Cloud deployment..." -ForegroundColor Green

# Check if gcloud is installed
try {
    $gcloudVersion = gcloud version 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Google Cloud SDK is not installed. Please install it first." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Google Cloud SDK is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

# Check if user is authenticated
$authStatus = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null
if (-not $authStatus) {
    Write-Host "⚠️  You are not authenticated with Google Cloud. Please run:" -ForegroundColor Yellow
    Write-Host "gcloud auth login" -ForegroundColor White
    exit 1
}

# Get project ID
$projectId = gcloud config get-value project 2>$null
if (-not $projectId) {
    Write-Host "❌ No project ID set. Please set it with:" -ForegroundColor Red
    Write-Host "gcloud config set project YOUR_PROJECT_ID" -ForegroundColor White
    exit 1
}

Write-Host "✅ Using project: $projectId" -ForegroundColor Green

# Enable required APIs
Write-Host "📋 Enabling required APIs..." -ForegroundColor Yellow
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build and deploy using Cloud Build
Write-Host "🔨 Building and deploying with Cloud Build..." -ForegroundColor Yellow
gcloud builds submit --config cloudbuild.yaml .

Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green

# Get the service URL
$serviceUrl = gcloud run services describe loyverse-automation-api --region=us-central1 --format="value(status.url)" 2>$null
Write-Host "🌐 Your service is available at: $serviceUrl" -ForegroundColor Green

Write-Host "📊 To view logs, run:" -ForegroundColor Green
Write-Host "gcloud logs tail --service=loyverse-automation-api" -ForegroundColor White

Write-Host "🔧 To update environment variables, run:" -ForegroundColor Green
Write-Host "gcloud run services update loyverse-automation-api --region=us-central1 --set-env-vars=KEY=VALUE" -ForegroundColor White 