Write-Host "🚀 Booting SafetyOS Application Suite..." -ForegroundColor Cyan

# Create env file if not exists
if (-not (Test-Path ".env")) {
    Write-Host "Creating default .env from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
}

# Run docker-compose
Write-Host "Starting Docker containers..." -ForegroundColor Green
docker-compose up --build -d

Write-Host "✅ SafetyOS successfully started!" -ForegroundColor Green
Write-Host "Frontend is running at http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend is running at http://localhost:8000" -ForegroundColor Cyan
Write-Host "To view real-time logs, run: docker-compose logs -f" -ForegroundColor Yellow
