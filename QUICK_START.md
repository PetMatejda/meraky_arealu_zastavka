# Rychlý start - GitHub a automatické nasazení

## ✅ Git repository je připraveno!

Git repository bylo inicializováno a všechny soubory jsou připraveny k commitování.

## Další kroky:

### 1. Vytvořte GitHub repository

1. Jděte na https://github.com/new
2. Název: `utility-manager` (nebo jiný)
3. **Nevyplňujte** README, .gitignore nebo license
4. Klikněte **Create repository**

### 2. Připojte lokální repo k GitHubu

Spusťte v terminálu (nahraďte YOUR_USERNAME a REPO_NAME):

```bash
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

### 3. Nastavení automatického nasazení

**Doporučená varianta - Vercel (nejjednodušší):**

1. Jděte na https://vercel.com
2. **Add New Project** → Importujte váš GitHub repo
3. Přidejte Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Deploy**

Vercel automaticky nasadí aplikaci při každém push!

### 4. Automatické aktualizace

Po nastavení Vercel:
- Každý `git push` automaticky nasadí novou verzi
- GitHub Actions spustí CI (testy, build)
- Vše funguje automaticky! 🚀

## Příkazy pro práci s gitem:

### Standardní způsob:

```bash
# Zkontrolovat změny
git status

# Přidat všechny změny
git add .

# Vytvořit commit
git commit -m "Popis změn"

# Push na GitHub (automaticky nasadí)
git push
```

### Automatický commit a push (rychlejší):

```bash
# Automaticky commit a push s výchozí zprávou
npm run commit

# Nebo s vlastní zprávou
npm run commit:msg "Moje změna"
```

Nebo přímo PowerShell script:
```powershell
.\scripts\auto-commit.ps1 "Popis změn"
```

## Podrobnější instrukce

Viz [GITHUB_SETUP.md](./GITHUB_SETUP.md) pro detailní návod.

