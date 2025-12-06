# Nastavení GitHub a automatického deploymentu

## 1. Vytvoření GitHub repository

1. Přejděte na [GitHub](https://github.com) a přihlaste se
2. Klikněte na **New repository** (nebo použijte [tento odkaz](https://github.com/new))
3. Vyplňte:
   - **Repository name:** `utility-manager` (nebo jiný název)
   - **Description:** Správa měřičů v komerčním areálu
   - **Visibility:** Public nebo Private (podle vašich preferencí)
   - **Nevyplňujte** README, .gitignore nebo license (už máme)
4. Klikněte na **Create repository**

## 2. Připojení lokálního repozitáře k GitHubu

V terminálu spusťte:

```bash
# Přidání všech souborů
git add .

# Vytvoření prvního commitu
git commit -m "Initial commit: UtilityManager aplikace"

# Přidání remote repository (nahraďte YOUR_USERNAME a REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Přejmenování hlavní větve na main (pokud je potřeba)
git branch -M main

# Push na GitHub
git push -u origin main
```

## 3. Nastavení automatického deploymentu na Vercel

### Možnost A: Automatické nasazení přes Vercel (doporučeno)

1. Přejděte na [Vercel](https://vercel.com) a přihlaste se
2. Klikněte na **Add New Project**
3. Importujte váš GitHub repository
4. Vercel automaticky detekuje Next.js projekt
5. Přidejte Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Klikněte na **Deploy**

Vercel automaticky nasadí aplikaci při každém push do main větve.

### Možnost B: Použití GitHub Actions (pokud chcete více kontroly)

1. V GitHub repository přejděte do **Settings → Secrets and variables → Actions**
2. Přidejte následující secrets:
   - `NEXT_PUBLIC_SUPABASE_URL` - URL vašeho Supabase projektu
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon key z Supabase
   - `VERCEL_TOKEN` - Token z Vercel (Settings → Tokens)
   - `VERCEL_ORG_ID` - Organization ID z Vercel
   - `VERCEL_PROJECT_ID` - Project ID z Vercel

3. GitHub Actions automaticky spustí workflow při každém push

## 4. Automatické commity (volitelné)

Pokud chcete automaticky commitovat změny, můžete použít GitHub Actions workflow, ale **nedoporučuje se** - lepší je commitovat manuálně.

Místo toho můžete použít git hooks nebo automatizaci přes GitHub Actions jen pro deployment.

## 5. Ověření nastavení

Po pushnutí kódu:

1. Zkontrolujte GitHub repository - měly by se zobrazit všechny soubory
2. Zkontrolujte **Actions** tab - měl by běžet CI workflow
3. Pokud jste nastavili Vercel, aplikace by se měla automaticky nasadit

## 6. Práce s repozitářem

### Přidání změn a push:

```bash
# Zkontrolovat změny
git status

# Přidat změny
git add .

# Vytvořit commit
git commit -m "Popis změn"

# Push na GitHub
git push
```

### Vytvoření nové větve pro feature:

```bash
# Vytvořit novou větev
git checkout -b feature/nazev-feature

# Udělat změny, commit, push
git add .
git commit -m "Popis feature"
git push -u origin feature/nazev-feature
```

## Troubleshooting

### Pokud git push selže:

1. Zkontrolujte, že máte správná oprávnění k repository
2. Zkontrolujte remote URL: `git remote -v`
3. Pokud je problém s autentizací, použijte Personal Access Token místo hesla

### Pokud se deployment nespustí:

1. Zkontrolujte GitHub Actions logs
2. Ověřte, že jsou nastavené všechny potřebné secrets
3. Zkontrolujte, že workflow soubory jsou v `.github/workflows/`

