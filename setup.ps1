# ============================================
# Установка KinoTrack (SQLite - без PostgreSQL!)
# ============================================

Write-Host "🎬 Установка KinoTrack" -ForegroundColor Cyan
Write-Host "   База данных: SQLite (всё в одном файле)" -ForegroundColor Gray
Write-Host ""

# Проверка Node.js
Write-Host "📦 Проверка Node.js..." -ForegroundColor Yellow
try {
    $v = node --version
    Write-Host "  OK: $v" -ForegroundColor Green
} catch {
    Write-Host "  ОШИБКА: Установите Node.js с https://nodejs.org/" -ForegroundColor Red
    pause
    exit 1
}

# Установка зависимостей бэкенда
Write-Host ""
Write-Host "📦 Установка бэкенда..." -ForegroundColor Yellow
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ОШИБКА установки" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "  OK" -ForegroundColor Green
Set-Location ..

# Установка зависимостей фронтенда
Write-Host ""
Write-Host "📦 Установка фронтенда..." -ForegroundColor Yellow
Set-Location frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ОШИБКА установки" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "  OK" -ForegroundColor Green
Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  УСТАНОВКА ЗАВЕРШЕНА!" -ForegroundColor Green
Write-Host ""
Write-Host "  Запуск: .\start.ps1" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
pause
