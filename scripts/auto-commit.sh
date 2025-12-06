#!/bin/bash
# Automatický commit a push změn
# Použití: ./scripts/auto-commit.sh "Popis změn"

MESSAGE=${1:-"Auto-commit: $(date '+%Y-%m-%d %H:%M:%S')"}

echo "🔄 Kontroluji změny..."

# Zkontrolovat, jestli jsou nějaké změny
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ Žádné změny k commitování"
    exit 0
fi

echo "📝 Přidávám změny..."
git add .

echo "💾 Vytvářím commit..."
git commit -m "$MESSAGE"

if [ $? -eq 0 ]; then
    echo "🚀 Pushuji na GitHub..."
    git push
    
    if [ $? -eq 0 ]; then
        echo "✅ Úspěšně commitováno a pushnuto!"
        echo "🌐 Aplikace se automaticky nasadí na Vercel"
    else
        echo "❌ Chyba při pushování"
        exit 1
    fi
else
    echo "❌ Chyba při commitování"
    exit 1
fi

