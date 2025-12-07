# Spuštění migrace 003_add_initial_states.sql

## Rychlý postup:

1. **Otevřete Supabase Dashboard**
   - Přejděte na https://app.supabase.com
   - Vyberte svůj projekt

2. **Otevřete SQL Editor**
   - V levém menu klikněte na **SQL Editor**
   - Klikněte na **New query**

3. **Zkopírujte a spusťte migraci**
   - Otevřete soubor `supabase/migrations/003_add_initial_states.sql`
   - Zkopírujte celý obsah
   - Vložte do SQL Editor v Supabase
   - Klikněte na **Run** (nebo stiskněte Ctrl+Enter)

4. **Ověření**
   - Po úspěšném spuštění byste měli vidět zprávu "Success"
   - Můžete zkontrolovat v Table Editor, že tabulka `meters` má nové sloupce `start_value` a `start_period_id`

## Alternativní způsob (pokud máte Supabase CLI):

```bash
supabase db push
```

Tento příkaz automaticky spustí všechny nové migrace.

## Obsah migrace:

Migrace přidá do tabulky `meters`:
- `start_value` (DECIMAL) - počáteční hodnota měřáku
- `start_period_id` (UUID) - reference na fakturační období od kterého se počítá

Plus vytvoří index pro rychlejší dotazy.

