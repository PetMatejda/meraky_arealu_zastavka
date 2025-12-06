# Automatická synchronizace s GitHubem

Projekt má nastavenou automatickou synchronizaci s GitHubem. Existují dva způsoby:

## 1. Automatický push po commitu (Git Hook)

Po každém `git commit` se automaticky pushne na GitHub.

### Nastavení (jednorázově):

```powershell
.\scripts\setup-auto-sync.ps1
```

### Jak to funguje:

1. Uděláte změny v kódu
2. Vytvoříte commit: `git commit -m "Moje změna"`
3. **Automaticky** se pushne na GitHub
4. GitHub Actions spustí CI/CD
5. Vercel automaticky nasadí novou verzi

## 2. Watch script (sledování změn souborů)

Script automaticky sleduje změny a commit + push při každé změně.

### Spuštění:

```powershell
.\scripts\watch-and-sync.ps1
```

### Jak to funguje:

- Script běží na pozadí
- Každých 5 sekund kontroluje změny
- Pokud jsou změny, automaticky:
  1. Přidá je do gitu (`git add .`)
  2. Vytvoří commit s timestampem
  3. Pushne na GitHub
  4. Vercel nasadí novou verzi

**Pozor:** Tento režim automaticky commituje všechny změny. Používejte opatrně!

## 3. Manuální synchronizace

Pokud nechcete automatickou synchronizaci, můžete použít:

```bash
# Standardní workflow
git add .
git commit -m "Popis změn"
git push

# Nebo použít auto-commit script
npm run commit
```

## Doporučený workflow

**Pro vývoj:**
- Použijte **Git Hook** (automatický push po commitu)
- Máte kontrolu nad tím, kdy se commit vytvoří
- Automaticky se pushne a nasadí

**Pro rychlé změny:**
- Použijte **Watch script** pro automatické commitování
- Vhodné pro malé změny a testování

## Ověření nastavení

Zkontrolujte, že git hook funguje:

```bash
# Vytvořit test commit
git commit --allow-empty -m "Test auto-sync"

# Mělo by se automaticky pushnout
```

## Troubleshooting

### Git hook nefunguje:

1. Zkontrolujte, že hook existuje: `.git/hooks/post-commit`
2. Spusťte setup znovu: `.\scripts\setup-auto-sync.ps1`
3. Zkontrolujte oprávnění: hook musí být spustitelný

### Watch script nefunguje:

1. Zkontrolujte, že máte oprávnění k zápisu do gitu
2. Ověřte, že remote je správně nastaven: `git remote -v`
3. Zkontrolujte, že máte oprávnění pushnout: `git push --dry-run`

### Push selže:

1. Zkontrolujte autentizaci s GitHubem
2. Ověřte, že máte oprávnění k repository
3. Zkontrolujte network připojení
