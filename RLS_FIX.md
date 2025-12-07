# Oprava RLS Policies - Povolení přístupu bez autentizace

## Problém

Aplikace vyžadovala autentizované uživatele pro přístup k datům, ale aplikace autentizaci nepoužívá. To způsobovalo chybu:
```
new row violates row-level security policy for table "meters"
```

## Řešení

Byla vytvořena nová migrace `002_fix_rls_policies.sql`, která upravuje RLS policies tak, aby umožňovaly přístup i bez autentizace (pomocí anon key).

## Jak aplikovat migraci

### Varianta 1: Přes Supabase Dashboard (doporučeno)

1. Otevřete **Supabase Dashboard** → **SQL Editor**
2. Vytvořte nový dotaz
3. Zkopírujte celý obsah souboru `supabase/migrations/002_fix_rls_policies.sql`
4. Vložte do SQL Editor
5. Klikněte na **Run** (nebo stiskněte Ctrl+Enter)
6. Ověřte, že dotaz proběhl úspěšně (měli byste vidět "Success. No rows returned")

### Varianta 2: Přes Supabase CLI

```bash
supabase db push
```

## Co migrace dělá

1. **Odstraní staré policies** vyžadující autentizaci
2. **Vytvoří nové policies**, které povolují přístup všem (včetně anonymních uživatelů)

## Důležité upozornění

⚠️ **Bezpečnostní varování**: Tato migrace povoluje přístup ke všem datům bez autentizace. To je vhodné pro:
- Vývojové/testovací prostředí
- Interní aplikace s omezeným přístupem
- Aplikace, kde je bezpečnost řešena jinak (např. VPN, IP whitelist)

Pro produkční prostředí doporučujeme:
1. Implementovat Supabase Auth (přihlašování uživatelů)
2. Upravit RLS policies pro role-based access control
3. Použít service role key pro server-side operace

## Ověření, že to funguje

Po aplikaci migrace by mělo být možné:
- ✅ Vytvářet měřáky bez chyby
- ✅ Číst a upravovat všechny záznamy
- ✅ Aplikace by měla fungovat na Vercelu bez problémů

## Návrat k autentizaci (v budoucnu)

Pokud budete chtít přidat autentizaci:
1. Implementujte Supabase Auth v aplikaci
2. Vytvořte novou migraci, která změní policies zpět na `auth.role() = 'authenticated'`
3. Nebo vytvořte kombinované policies pro oba případy

