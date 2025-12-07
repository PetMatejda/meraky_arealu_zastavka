-- Fix RLS policies to allow access without authentication
-- This migration updates the policies to allow anonymous access
-- Note: For production, consider implementing proper authentication

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read tenants" ON tenants;
DROP POLICY IF EXISTS "Allow authenticated users to write tenants" ON tenants;
DROP POLICY IF EXISTS "Allow authenticated users to read meters" ON meters;
DROP POLICY IF EXISTS "Allow authenticated users to write meters" ON meters;
DROP POLICY IF EXISTS "Allow authenticated users to read billing_periods" ON billing_periods;
DROP POLICY IF EXISTS "Allow authenticated users to write billing_periods" ON billing_periods;
DROP POLICY IF EXISTS "Allow authenticated users to read readings" ON readings;
DROP POLICY IF EXISTS "Allow authenticated users to write readings" ON readings;

-- Create new policies that allow anonymous access (using anon key)
-- This allows the application to work without requiring user authentication

-- Tenants policies
CREATE POLICY "Allow anon users to read tenants" ON tenants
    FOR SELECT USING (true);

CREATE POLICY "Allow anon users to write tenants" ON tenants
    FOR ALL USING (true);

-- Meters policies
CREATE POLICY "Allow anon users to read meters" ON meters
    FOR SELECT USING (true);

CREATE POLICY "Allow anon users to write meters" ON meters
    FOR ALL USING (true);

-- Billing periods policies
CREATE POLICY "Allow anon users to read billing_periods" ON billing_periods
    FOR SELECT USING (true);

CREATE POLICY "Allow anon users to write billing_periods" ON billing_periods
    FOR ALL USING (true);

-- Readings policies
CREATE POLICY "Allow anon users to read readings" ON readings
    FOR SELECT USING (true);

CREATE POLICY "Allow anon users to write readings" ON readings
    FOR ALL USING (true);

