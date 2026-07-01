# Script to start Node.js backend server with dependencies check for PSH JMSK Portal
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " Memulakan Server API & Web Portal PSH JMSK " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Check if node_modules directory exists
if (-not (Test-Path "node_modules")) {
    Write-Host "node_modules tidak dijumpai. Memasang dependensi Node.js..." -ForegroundColor Yellow
    npm install
}

Write-Host "Menyemak status pelayan backend..." -ForegroundColor Yellow
node server.js
