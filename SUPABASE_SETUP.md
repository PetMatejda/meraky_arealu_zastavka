# Supabase Setup Guide

## 1. Vytvoření projektu

1. Vytvořte nový projekt na [supabase.com](https://supabase.com)
2. Poznamenejte si URL a anon key z Settings → API

## 2. Spuštění migrací

1. Otevřete SQL Editor v Supabase Dashboard
2. Zkopírujte obsah souboru `supabase/migrations/001_initial_schema.sql`
3. Vložte do SQL Editor a spusťte

Alternativně můžete použít Supabase CLI:
```bash
supabase db push
```

## 3. Vytvoření Storage Bucketu

1. Přejděte do **Storage** v Supabase Dashboard
2. Klikněte na **New bucket**
3. Název: `meter-photos`
4. Veřejný přístup: **Public** (nebo použijte RLS policies)
5. Vytvořte bucket

### RLS Policies pro Storage (volitelné)

Pokud chcete použít RLS místo veřejného přístupu:

```sql
-- Povolit čtení pro authenticated users
CREATE POLICY "Allow authenticated users to read photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'meter-photos' AND auth.role() = 'authenticated');

-- Povolit upload pro authenticated users
CREATE POLICY "Allow authenticated users to upload photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'meter-photos' AND auth.role() = 'authenticated');
```

## 4. Nastavení Environment Variables

Vytvořte soubor `.env.local` v kořenovém adresáři projektu:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 5. Testování připojení

Po nastavení můžete otestovat připojení spuštěním aplikace:

```bash
npm install
npm run dev
```

Aplikace by se měla načíst na `http://localhost:3000`

## 6. Row Level Security (RLS)

Schéma obsahuje základní RLS policies, které povolují authenticated users přístup ke všem tabulkám. Pro produkci doporučujeme:

1. Upravit policies podle vašich požadavků
2. Implementovat role-based access control
3. Přidat validace na úrovni databáze

## 7. Testovací data (volitelné)

Pro testování můžete vložit testovací data:

```sql
-- Vytvořit testovacího podnájemce
INSERT INTO tenants (company_name, ico) 
VALUES ('Test Company', '12345678');

-- Vytvořit testovací měřák
INSERT INTO meters (serial_number, media_type, location_description)
VALUES ('TEST-001', 'electricity', 'Hlavní vchod');

-- Vytvořit fakturační období
INSERT INTO billing_periods (month, year, status)
VALUES (12, 2024, 'open');
```

