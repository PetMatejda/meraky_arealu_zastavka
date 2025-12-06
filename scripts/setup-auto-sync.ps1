# Nastavení automatické synchronizace s GitHubem
# Tento script nastaví git hook pro automatický push po commitu

Write-Host "Nastavuji automatickou synchronizaci s GitHubem..." -ForegroundColor Cyan

$hookPath = ".git\hooks\post-commit"
$hookContent = @"
#!/bin/sh
# Automatický push po každém commitu

# Push na GitHub
git push origin main

# Zobrazit zprávu
echo ""
echo "✅ Automaticky pushnuto na GitHub!"
echo "🌐 Aplikace se automaticky nasadí na Vercel"
"@

# Vytvořit hook
$hookContent | Out-File -FilePath $hookPath -Encoding UTF8 -NoNewline

# Nastavit spustitelná práva (pro Git Bash)
$chmodPath = 'C:\Program Files\Git\bin\chmod.exe'
if (Test-Path $chmodPath) {
    & $chmodPath +x $hookPath
}

Write-Host "Git hook vytvoren: $hookPath" -ForegroundColor Green
Write-Host ""
Write-Host "Od ted se kazdy commit automaticky pushne na GitHub!" -ForegroundColor Yellow
Write-Host "Pro testovani: git commit -m 'Test commit'"
