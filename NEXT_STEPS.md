# Další kroky po úspěšné SQL migraci

## ✅ Co už máte hotovo:
- ✅ SQL schéma vytvořeno v Supabase
- ✅ Tabulky, funkce a triggery jsou aktivní
- ✅ RLS policies jsou nastavené

## 📋 Co je potřeba udělat teď:

### 1. Vytvořit Storage Bucket pro fotografie měřáků

1. Přejděte do **Supabase Dashboard** → **Storage**
2. Klikněte na **New bucket**
3. Nastavení:
   - **Název:** `meter-photos`
   - **Veřejný přístup:** `Public` (nebo použijte RLS policies)
4. Klikněte **Create bucket**

**Poznámka:** Pokud chcete použít RLS místo veřejného přístupu, můžete spustit tento SQL:

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

### 2. Nastavit Environment Variables

1. Vytvořte soubor `.env.local` v kořenovém adresáři projektu (pokud ještě neexistuje)

2. Zkopírujte z `.env.example`:
   ```bash
   cp .env.example .env.local
   ```

3. Vyplňte hodnoty z Supabase:
   - Otevřete **Supabase Dashboard** → **Settings** → **API**
   - Zkopírujte:
     - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
     - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. Váš `.env.local` by měl vypadat takto:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 3. Nainstalovat závislosti

```bash
npm install
```

### 4. Spustit vývojový server

```bash
npm run dev
```

Aplikace bude dostupná na: **http://localhost:3000**

### 5. Vytvořit testovací data (volitelné)

Pro testování můžete vytvořit základní testovací data:

```sql
-- Vytvořit testovacího podnájemce
INSERT INTO tenants (company_name, ico, contact_email) 
VALUES ('Test Company s.r.o.', '12345678', 'test@example.com');

-- Vytvořit testovací měřák
INSERT INTO meters (serial_number, media_type, location_description)
VALUES ('TEST-001', 'electricity', 'Hlavní vchod - přízemí');

-- Vytvořit fakturační období pro aktuální měsíc
INSERT INTO billing_periods (month, year, status, unit_price_electricity)
VALUES (
    EXTRACT(MONTH FROM NOW())::INTEGER,
    EXTRACT(YEAR FROM NOW())::INTEGER,
    'open',
    5.50
);
```

## 🎯 Co můžete teď dělat:

### A) Testovat aplikaci lokálně:

1. Otevřete http://localhost:3000
2. Měli byste vidět Dashboard
3. Zkuste:
   - Přidat měřák (Měřáky → Přidat měřák)
   - Vytvořit fakturační období (Nastavení → Nové období)
   - Vytvořit odečet (Odečty → vyfotit měřák)

### B) Nastavit autentizaci (pokud chcete):

Aktuálně jsou RLS policies nastavené pro `authenticated` uživatele. Pokud chcete použít autentizaci:

1. V Supabase Dashboard → **Authentication** → **Providers**
2. Povolte požadovaný provider (Email, Google, atd.)
3. V aplikaci přidejte login stránku

**Nebo** pro testování můžete dočasně změnit RLS policies na:

```sql
-- Povolit všem (jen pro vývoj!)
DROP POLICY IF EXISTS "Allow authenticated users to read tenants" ON tenants;
CREATE POLICY "Allow all to read tenants" ON tenants FOR SELECT USING (true);
CREATE POLICY "Allow all to write tenants" ON tenants FOR ALL USING (true);
-- Opakujte pro ostatní tabulky...
```

### C) Nasazení na produkci:

1. **Vercel** (doporučeno):
   - Jděte na https://vercel.com
   - Importujte váš GitHub repository
   - Přidejte Environment Variables
   - Deploy

2. **Jiné platformy:**
   - Build: `npm run build`
   - Start: `npm start`

## 🔍 Ověření, že vše funguje:

1. **Zkontrolujte Supabase:**
   - Dashboard → **Table Editor** → měli byste vidět tabulky
   - Dashboard → **Storage** → měl by existovat bucket `meter-photos`

2. **Zkontrolujte aplikaci:**
   - Spusťte `npm run dev`
   - Otevřete http://localhost:3000
   - Měla by se načíst aplikace bez chyb

3. **Zkontrolujte konzoli:**
   - Otevřete Developer Tools (F12)
   - Zkontrolujte, že nejsou chyby v konzoli
   - Zkontrolujte Network tab - měly by procházet requesty na Supabase

## 🐛 Troubleshooting:

### Aplikace se nenačte:
- Zkontrolujte, že `.env.local` existuje a má správné hodnoty
- Zkontrolujte, že Supabase URL a KEY jsou správné
- Restartujte dev server: `npm run dev`

### Chyby při načítání dat:
- Zkontrolujte RLS policies v Supabase
- Zkontrolujte, že máte oprávnění k tabulkám
- Zkontrolujte Network tab v Developer Tools

### Fotografie se neukládají:
- Zkontrolujte, že Storage bucket `meter-photos` existuje
- Zkontrolujte RLS policies pro Storage
- Zkontrolujte, že bucket je public nebo máte správná oprávnění

## 📚 Užitečné odkazy:

- **Supabase Dashboard:** https://app.supabase.com
- **Dokumentace:** Viz `README.md`, `SUPABASE_SETUP.md`
- **GitHub:** https://github.com/PetMatejda/meraky_arealu_zastavka

## ✅ Checklist:

- [ ] Storage bucket `meter-photos` vytvořen
- [ ] `.env.local` soubor vytvořen a vyplněn
- [ ] `npm install` spuštěno
- [ ] `npm run dev` funguje
- [ ] Aplikace se načte na http://localhost:3000
- [ ] Testovací data vytvořena (volitelné)
- [ ] Všechno funguje! 🎉

---

**Potřebujete pomoc?** Zkontrolujte dokumentaci nebo se podívejte na GitHub Issues.

