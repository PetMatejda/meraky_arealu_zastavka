-- UtilityManager Database Schema
-- Supabase Migration File

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tenants (Podnájemci)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    ico VARCHAR(20) UNIQUE,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meters (Měřáky)
CREATE TABLE meters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('gas', 'electricity', 'water')),
    parent_meter_id UUID REFERENCES meters(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    location_description TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Constraint: max depth 4 levels
    CONSTRAINT check_max_depth CHECK (
        (SELECT COUNT(*) FROM meters m1 
         WHERE m1.id = meters.id 
         AND EXISTS (
             SELECT 1 FROM meters m2 WHERE m2.parent_meter_id = m1.id
             AND EXISTS (
                 SELECT 1 FROM meters m3 WHERE m3.parent_meter_id = m2.id
                 AND EXISTS (
                     SELECT 1 FROM meters m4 WHERE m4.parent_meter_id = m3.id
                 )
             )
         )
        ) = 0
    )
);

-- Create index for parent_meter_id for faster hierarchy queries
CREATE INDEX idx_meters_parent ON meters(parent_meter_id);
CREATE INDEX idx_meters_tenant ON meters(tenant_id);
CREATE INDEX idx_meters_serial ON meters(serial_number);

-- Billing Periods (Fakturační období)
CREATE TABLE billing_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    unit_price_gas DECIMAL(10, 4),
    unit_price_electricity DECIMAL(10, 4),
    unit_price_water DECIMAL(10, 4),
    total_invoice_gas DECIMAL(12, 2),
    total_invoice_electricity DECIMAL(12, 2),
    total_invoice_water DECIMAL(12, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(month, year)
);

-- Readings (Odečty)
CREATE TABLE readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meter_id UUID NOT NULL REFERENCES meters(id) ON DELETE CASCADE,
    billing_period_id UUID NOT NULL REFERENCES billing_periods(id) ON DELETE CASCADE,
    date_taken TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    value DECIMAL(12, 2) NOT NULL,
    photo_url TEXT,
    note TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Ensure one reading per meter per billing period
    UNIQUE(meter_id, billing_period_id)
);

-- Create indexes for readings
CREATE INDEX idx_readings_meter ON readings(meter_id);
CREATE INDEX idx_readings_period ON readings(billing_period_id);
CREATE INDEX idx_readings_date ON readings(date_taken);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meters_updated_at BEFORE UPDATE ON meters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_periods_updated_at BEFORE UPDATE ON billing_periods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_readings_updated_at BEFORE UPDATE ON readings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get meter hierarchy depth
CREATE OR REPLACE FUNCTION get_meter_depth(meter_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    depth INTEGER := 0;
    current_id UUID := meter_uuid;
    parent_id UUID;
BEGIN
    WHILE current_id IS NOT NULL LOOP
        SELECT parent_meter_id INTO parent_id FROM meters WHERE id = current_id;
        IF parent_id IS NOT NULL THEN
            depth := depth + 1;
            current_id := parent_id;
        ELSE
            EXIT;
        END IF;
    END LOOP;
    RETURN depth;
END;
$$ LANGUAGE plpgsql;

-- View for meter hierarchy (useful for reporting)
CREATE OR REPLACE VIEW meter_hierarchy AS
WITH RECURSIVE meter_tree AS (
    -- Base case: root meters (no parent)
    SELECT 
        id,
        serial_number,
        media_type,
        parent_meter_id,
        tenant_id,
        location_description,
        0 as depth,
        ARRAY[id] as path
    FROM meters
    WHERE parent_meter_id IS NULL
    
    UNION ALL
    
    -- Recursive case: child meters
    SELECT 
        m.id,
        m.serial_number,
        m.media_type,
        m.parent_meter_id,
        m.tenant_id,
        m.location_description,
        mt.depth + 1,
        mt.path || m.id
    FROM meters m
    INNER JOIN meter_tree mt ON m.parent_meter_id = mt.id
    WHERE mt.depth < 3  -- Max depth 4 (0-3)
)
SELECT * FROM meter_tree;

-- Row Level Security (RLS) policies
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (adjust based on your auth requirements)
-- For now, allow authenticated users to read/write
CREATE POLICY "Allow authenticated users to read tenants" ON tenants
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to write tenants" ON tenants
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read meters" ON meters
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to write meters" ON meters
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read billing_periods" ON billing_periods
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to write billing_periods" ON billing_periods
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read readings" ON readings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to write readings" ON readings
    FOR ALL USING (auth.role() = 'authenticated');

