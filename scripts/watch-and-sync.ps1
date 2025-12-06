# Watch script - automaticky sleduje změny a synchronizuje s GitHubem
# Použití: .\scripts\watch-and-sync.ps1

Write-Host "👀 Sleduji změny v projektu..." -ForegroundColor Cyan
Write-Host "📝 Každá změna bude automaticky commitována a pushnuta" -ForegroundColor Yellow
Write-Host "⏹️  Stiskněte Ctrl+C pro zastavení" -ForegroundColor Gray
Write-Host ""

$lastCommit = git log -1 --format="%H" 2>$null
if (-not $lastCommit) {
    $lastCommit = ""
}

while ($true) {
    Start-Sleep -Seconds 5
    
    # Zkontrolovat změny
    $status = git status --porcelain
    if ($status) {
        Write-Host "🔄 Detekovány změny, synchronizuji..." -ForegroundColor Cyan
        
        # Přidat všechny změny
        git add .
        
        # Vytvořit commit s timestampem
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $commitMessage = "Auto-sync: $timestamp"
        
        git commit -m $commitMessage
        
        if ($LASTEXITCODE -eq 0) {
            # Push na GitHub
            git push origin main
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Synchronizováno s GitHubem!" -ForegroundColor Green
                Write-Host "🌐 Aplikace se automaticky nasadí na Vercel" -ForegroundColor Yellow
            } else {
                Write-Host "❌ Chyba při pushování" -ForegroundColor Red
            }
        } else {
            Write-Host "⚠️  Žádné změny k commitování" -ForegroundColor Yellow
        }
        
        Write-Host ""
    }
}

