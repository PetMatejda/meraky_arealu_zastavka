# UtilityManager

Aplikace pro správu a odečty měřičů (plyn, elektřina, voda) v komerčním areálu s důrazem na mobilní použití a přefakturaci nákladů.

## Tech Stack

- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Shadcn UI
- **Backend/Database:** Supabase (PostgreSQL, Auth, Storage)
- **OCR/AI:** Tesseract.js (klientské rozpoznávání) nebo OpenAI Vision API
- **State Management:** React Query (TanStack Query)

## Struktura projektu

```
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth stránky
│   ├── dashboard/         # Dashboard
│   ├── readings/          # Mobilní odečty
│   ├── meters/            # Správa měřáků
│   ├── billing/           # Fakturace
│   └── settings/          # Nastavení
├── components/            # React komponenty
│   ├── ui/               # Shadcn UI komponenty
│   └── ...               # Vlastní komponenty
├── lib/                   # Utility funkce
│   ├── supabase/         # Supabase klient
│   ├── types/            # TypeScript typy
│   └── utils/            # Pomocné funkce
├── supabase/             # Supabase migrace
│   └── migrations/       # SQL migrační soubory
└── public/               # Statické soubory
```

## Instalace

1. Nainstalujte závislosti:
```bash
npm install
```

2. Nastavte proměnné prostředí:
```bash
cp .env.example .env.local
```

Vyplňte v `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - URL vašeho Supabase projektu
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon key z Supabase Settings → API

3. Nastavte Supabase:
   - Vytvořte nový projekt na [supabase.com](https://supabase.com)
   - Spusťte migraci: Otevřete SQL Editor a spusťte `supabase/migrations/001_initial_schema.sql`
   - Vytvořte Storage bucket `meter-photos` (Storage → New bucket)
   - Podrobné instrukce v [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

4. Spusťte vývojový server:
```bash
npm run dev
```

Aplikace bude dostupná na `http://localhost:3000`

## Funkcionality

- ✅ **Správa hierarchie měřáků** - CRUD operace, stromová struktura až 4 úrovně
- ✅ **Mobilní odečet** - Fotografování měřáků, OCR podpora (mockováno), automatické načítání předchozích stavů
- ✅ **Fakturace a přefakturace** - Automatický výpočet nákladů pro podnájemce
- ✅ **Reporting a export** - Detailní rozúčtování nákladů, export do CSV
- ✅ **Správa fakturačních období** - Vytváření období, nastavení cen
- ✅ **Správa podnájemců** - CRUD operace pro podnájemce

## Struktura projektu

Podrobný popis struktury projektu najdete v [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

