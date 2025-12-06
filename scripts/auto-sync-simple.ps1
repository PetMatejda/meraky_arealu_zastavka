# Jednoduchy script pro automatickou synchronizaci
# Pouziti: .\scripts\auto-sync-simple.ps1 "Popis zmeny"

param(
    [Parameter(Mandatory=$false)]
    [string]$Message = "Auto-sync: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
)

Write-Host "Synchronizuji zmeny s GitHubem..." -ForegroundColor Cyan

# Zkontrolovat zmeny
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "Zadne zmeny k synchronizaci" -ForegroundColor Yellow
    exit 0
}

# Add, commit, push
git add .
git commit -m $Message
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "Uspesne synchronizovano s GitHubem!" -ForegroundColor Green
    Write-Host "Aplikace se automaticky nasadi na Vercel" -ForegroundColor Yellow
} else {
    Write-Host "Chyba pri synchronizaci" -ForegroundColor Red
    exit 1
}

