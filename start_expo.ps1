Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "   AsEmOs - SERVIS DURUMU" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Docker Konteynerler:" -ForegroundColor Yellow
docker ps
Write-Host ""
Write-Host "===========================================" -ForegroundColor Green
Write-Host "   EXPO GO - TELEFON BAGLANTISI" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Adim 1: Telefonunda Expo Go ac" -ForegroundColor White
Write-Host "  Adim 2: 'Enter URL manually' sec" -ForegroundColor White
Write-Host "  Adim 3: Asagidaki URL'yi gir:" -ForegroundColor White
Write-Host ""
Write-Host "     exp://10.23.0.72:8081" -ForegroundColor Green
Write-Host ""
Write-Host "  Backend API : http://10.23.0.72:8000" -ForegroundColor Cyan
Write-Host "  Expo Metro  : http://localhost:8081" -ForegroundColor Cyan
Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location "D:\BitirmeProjesi\apps\mobile"
$env:NODE_OPTIONS = "--max-old-space-size=4096"
Write-Host "Expo baslatiliyor... QR kod asagida cikacak:" -ForegroundColor Yellow
Write-Host ""
npx expo start --lan
