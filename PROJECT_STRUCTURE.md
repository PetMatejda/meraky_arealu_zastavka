# Struktura projektu UtilityManager

## Přehled

Aplikace je postavena na Next.js 14+ s App Router, TypeScript, Tailwind CSS a Supabase jako backend.

## Struktura adresářů

```
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Auth stránky (budoucí rozšíření)
│   ├── dashboard/               # Dashboard stránka
│   │   └── page.tsx
│   ├── readings/                # Mobilní odečty
│   │   └── page.tsx
│   ├── meters/                  # Správa měřáků
│   │   └── page.tsx
│   ├── settings/                # Nastavení (období, podnájemci)
│   │   └── page.tsx
│   ├── layout.tsx               # Root layout s navigací
│   ├── page.tsx                 # Homepage (redirect na dashboard)
│   ├── providers.tsx            # React Query provider
│   └── globals.css              # Globální CSS s Tailwind
│
├── components/                   # React komponenty
│   ├── ui/                      # Shadcn UI komponenty
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   └── select.tsx
│   └── layout/                   # Layout komponenty
│       └── navbar.tsx           # Hlavní navigace
│
├── lib/                          # Utility funkce a konfigurace
│   ├── supabase/                # Supabase klient
│   │   ├── client.ts            # Supabase klient instance
│   │   └── types.ts             # TypeScript typy pro Supabase
│   ├── types/                   # TypeScript typy
│   │   └── database.ts          # Databázové typy
│   └── utils/                   # Pomocné funkce
│       ├── cn.ts                # Utility pro className merging
│       └── ocr.ts               # OCR funkce (Tesseract.js)
│
├── supabase/                     # Supabase migrace
│   └── migrations/
│       └── 001_initial_schema.sql  # Počáteční databázové schéma
│
├── public/                       # Statické soubory
│
├── package.json                  # NPM závislosti
├── tsconfig.json                 # TypeScript konfigurace
├── tailwind.config.ts           # Tailwind CSS konfigurace
├── next.config.js               # Next.js konfigurace
└── README.md                     # Hlavní dokumentace
```

## Databázové schéma

### Tabulky

1. **tenants** - Podnájemci
   - id, company_name, ico, contact_email, contact_phone, address

2. **meters** - Měřáky
   - id, serial_number, media_type, parent_meter_id, tenant_id, location_description, notes
   - Podporuje hierarchii až 4 úrovně (self-referencing FK)

3. **billing_periods** - Fakturační období
   - id, month, year, status, unit_price_*, total_invoice_*

4. **readings** - Odečty
   - id, meter_id, billing_period_id, date_taken, value, photo_url, note, created_by

### Views a funkce

- `meter_hierarchy` - Rekurzivní view pro zobrazení hierarchie měřáků
- `get_meter_depth()` - Funkce pro výpočet hloubky měřáku v hierarchii
- `update_updated_at_column()` - Trigger funkce pro automatické aktualizace timestampů

## Klíčové funkcionality

### 1. Mobilní odečet (`/readings`)

- **Workflow:**
  1. Výběr fakturačního období
  2. Pořízení fotografie měřáku
  3. OCR zpracování (mockováno, připraveno pro Tesseract.js)
  4. Automatické načtení předchozího stavu z minulého měsíce
  5. Validace (nový stav >= předchozí)
  6. Upload fotografie do Supabase Storage
  7. Uložení odečtu

### 2. Správa měřáků (`/meters`)

- CRUD operace pro měřáky
- Zobrazení hierarchie (stromová struktura)
- Přiřazení k podnájemci
- Nastavení nadřazeného měřáku

### 3. Nastavení (`/settings`)

- Správa fakturačních období
- Správa podnájemců
- Nastavení cen za jednotku
- Zadání celkových faktur od dodavatele

### 4. Dashboard (`/dashboard`)

- Přehled statistik
- Nedávné odečty
- Fakturační období

## State Management

Používáme **React Query (TanStack Query)** pro:
- Načítání dat ze Supabase
- Cache management
- Optimistic updates
- Automatic refetching

## Styling

- **Tailwind CSS** pro utility-first styling
- **Shadcn UI** komponenty pro konzistentní design
- **Mobile-first** přístup (velká tlačítka, snadné ovládání)

## OCR Implementace

Současná implementace obsahuje mock OCR funkci v `lib/utils/ocr.ts`. Pro produkční použití:

1. **Tesseract.js** - Klientské zpracování
   ```typescript
   import Tesseract from 'tesseract.js'
   const { data: { text } } = await Tesseract.recognize(imageFile, 'eng')
   ```

2. **OpenAI Vision API** - Server-side zpracování (doporučeno)
   - Vyžaduje API klíč
   - Lepší přesnost
   - Server-side processing

## Supabase Storage

Pro ukládání fotografií měřáků je potřeba vytvořit Storage bucket:

1. V Supabase Dashboard → Storage
2. Vytvořit bucket: `meter-photos`
3. Nastavit veřejný přístup (public) nebo použít RLS policies
4. Povolit upload pro authenticated users

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key  # Volitelné, pro OCR
```

## Další kroky

1. ✅ Základní struktura projektu
2. ✅ SQL schéma
3. ✅ Mobilní odečet s OCR placeholder
4. ✅ Správa měřáků s hierarchií
5. ⏳ Reporting a export (CSV/Excel)
6. ⏳ Fakturace a přefakturace nákladů
7. ⏳ Autentizace (Supabase Auth)
8. ⏳ RLS policies tuning
9. ⏳ Produkční OCR implementace

