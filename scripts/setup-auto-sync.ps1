# Nastavení automatické synchronizace s GitHubem
# Tento script nastaví git hook pro automatický push po commitu

Write-Host "Nastavuji automatickou synchronizaci s GitHubem..." -ForegroundColor Cyan

$hookPath = ".git\hooks\post-commit"
$hookPathPs1 = ".git\hooks\post-commit.ps1"

# Bash verze (pro Git Bash)
$hookContent = @"
#!/bin/sh
# Automaticky push po kazdem commitu

# Push na GitHub
git push origin main

# Zobrazit zpravu
echo ""
echo "Automaticky pushnuto na GitHub!"
echo "Aplikace se automaticky nasadi na Vercel"
"@

# PowerShell verze (pro Windows)
$hookContentPs1 = @"
# PowerShell verze post-commit hooku pro Windows

# Push na GitHub
git push origin main

# Zobrazit zpravu
Write-Host ""
Write-Host "Automaticky pushnuto na GitHub!" -ForegroundColor Green
Write-Host "Aplikace se automaticky nasadi na Vercel" -ForegroundColor Yellow
"@

# Vytvořit obě verze hooku
$hookContent | Out-File -FilePath $hookPath -Encoding ASCII -NoNewline
$hookContentPs1 | Out-File -FilePath $hookPathPs1 -Encoding UTF8

# Nastavit spustitelná práva (pro Git Bash)
$chmodPath = 'C:\Program Files\Git\bin\chmod.exe'
if (Test-Path $chmodPath) {
    & $chmodPath +x $hookPath
}

Write-Host "Git hook vytvoren: $hookPath" -ForegroundColor Green
Write-Host ""
Write-Host "Od ted se kazdy commit automaticky pushne na GitHub!" -ForegroundColor Yellow
Write-Host "Pro testovani: git commit -m 'Test commit'"
