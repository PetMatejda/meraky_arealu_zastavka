# Automatická synchronizace s GitHubem

Projekt je připojen k GitHubu na: **https://github.com/PetMatejda/meraky_arealu_zastavka.git**

## ✅ Aktuální stav

- ✅ Repository připojeno k GitHubu
- ✅ Všechny soubory jsou synchronizované
- ✅ GitHub Actions workflows jsou aktivní
- ✅ Automatické nasazení na Vercel je připraveno

## 🔄 Způsoby synchronizace

### 1. Rychlá synchronizace (doporučeno)

Použijte NPM script pro automatickou synchronizaci:

```bash
# Automaticky add + commit + push
npm run sync

# Nebo s vlastní zprávou
npm run sync:msg "Moje změna"
```

### 2. Git alias (acp = add, commit, push)

```bash
# Použijte git alias pro rychlý workflow
git acp "Popis změny"
```

### 3. Manuální synchronizace

```bash
git add .
git commit -m "Popis změn"
git push origin main
```

### 4. Watch script (sledování změn)

Pro automatické sledování změn a commitování:

```powershell
.\scripts\watch-and-sync.ps1
```

**Pozor:** Tento režim automaticky commituje všechny změny každých 5 sekund!

## 🚀 Automatické nasazení

Po každém push na GitHub:

1. **GitHub Actions** automaticky:
   - Spustí CI (testy, lint, build)
   - Ověří, že build projde

2. **Vercel** (pokud je nastaven):
   - Automaticky nasadí novou verzi
   - Dostupné na produkční URL

## 📝 Doporučený workflow

**Pro každodenní práci:**

```bash
# 1. Udělejte změny v kódu
# 2. Synchronizujte
npm run sync "Popis změny"

# Nebo použijte git alias
git acp "Popis změny"
```

**Pro větší změny:**

```bash
# 1. Vytvořte feature branch
git checkout -b feature/nova-funkce

# 2. Udělejte změny a commitněte
git add .
git commit -m "Přidána nová funkce"

# 3. Pushněte branch
git push origin feature/nova-funkce

# 4. Vytvořte Pull Request na GitHubu
```

## 🔍 Ověření synchronizace

Zkontrolujte stav:

```bash
# Zkontrolovat remote
git remote -v

# Zkontrolovat status
git status

# Zkontrolovat poslední commity
git log --oneline -5

# Zkontrolovat, jestli je vše synchronizované
git fetch
git status
```

## 🛠️ Troubleshooting

### Push selže s chybou autentizace:

1. Zkontrolujte GitHub credentials
2. Použijte Personal Access Token místo hesla
3. Nebo nastavte SSH key

### Hook nefunguje:

Git hooks na Windows mohou mít problémy. Použijte místo toho:
- `npm run sync` - nejspolehlivější
- `git acp "zpráva"` - git alias

### Změny se nepushují:

1. Zkontrolujte: `git status`
2. Zkontrolujte remote: `git remote -v`
3. Zkuste manuální push: `git push origin main`

## 📚 Další informace

- **GitHub repository:** https://github.com/PetMatejda/meraky_arealu_zastavka
- **GitHub Actions:** Zkontrolujte v repository → Actions tab
- **Vercel deployment:** Pokud je nastaven, zkontrolujte Vercel dashboard
