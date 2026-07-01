# Script to start local PHP development server for Jawatankuasa PSH (JMSK)
$port = 8080
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " Memulakan Server PSH JMSK Guna PHP & MySQL " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Pelayan Web PSH JMSK berjalan di http://localhost:$port/" -ForegroundColor Green
Write-Host "Sila pastikan Apache & MySQL dalam XAMPP diaktifkan." -ForegroundColor Yellow
Write-Host "Tekan Ctrl + C di terminal ini untuk menutup server." -ForegroundColor Red
Write-Host "=============================================" -ForegroundColor Cyan

& "C:\xampp\php\php.exe" -S localhost:$port
