# Automatický commit a push změn
# Použití: .\scripts\auto-commit.ps1 "Popis změn"

param(
    [Parameter(Mandatory=$false)]
    [string]$Message = "Auto-commit: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
)

Write-Host "🔄 Kontroluji změny..." -ForegroundColor Cyan

# Zkontrolovat, jestli jsou nějaké změny
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "✅ Žádné změny k commitování" -ForegroundColor Green
    exit 0
}

Write-Host "📝 Přidávám změny..." -ForegroundColor Cyan
git add .

Write-Host "💾 Vytvářím commit..." -ForegroundColor Cyan
git commit -m $Message

if ($LASTEXITCODE -eq 0) {
    Write-Host "🚀 Pushuji na GitHub..." -ForegroundColor Cyan
    git push
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Úspěšně commitováno a pushnuto!" -ForegroundColor Green
        Write-Host "🌐 Aplikace se automaticky nasadí na Vercel" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Chyba při pushování" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Chyba při commitování" -ForegroundColor Red
    exit 1
}

