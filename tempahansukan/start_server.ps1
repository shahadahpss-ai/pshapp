# start_server.ps1 for PoliSport Book
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  MEMULAKAN PELAYAN PEMBANGUNAN PHP BAGI POLISPORT BOOK" -ForegroundColor Green
Write-Host "  Pautan Sistem: http://localhost:8082" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Tekan Ctrl+C untuk menamatkan pelayan." -ForegroundColor Yellow

# Start PHP Development server
php -S 127.0.0.1:8082
