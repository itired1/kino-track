# ============================================
# Запуск KinoTrack
# ============================================

Write-Host "🎬 Запуск KinoTrack..." -ForegroundColor Cyan
Write-Host ""

# Запуск бэкенда
Write-Host "🚀 Бэкенд: http://localhost:3000" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm run dev"

Start-Sleep -Seconds 2

# Запуск фронтенда
Write-Host "🚀 Фронтенд: http://localhost:5173" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

Write-Host ""
Write-Host "✅ Всё запущено! Откройте http://localhost:5173" -ForegroundColor Green
Write-Host ""
Start-Sleep -Seconds 3
