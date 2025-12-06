export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          company_name: string
          ico: string | null
          contact_email: string | null
          contact_phone: string | null
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_name: string
          ico?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_name?: string
          ico?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      meters: {
        Row: {
          id: string
          serial_number: string
          media_type: 'gas' | 'electricity' | 'water'
          parent_meter_id: string | null
          tenant_id: string | null
          location_description: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          serial_number: string
          media_type: 'gas' | 'electricity' | 'water'
          parent_meter_id?: string | null
          tenant_id?: string | null
          location_description?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          serial_number?: string
          media_type?: 'gas' | 'electricity' | 'water'
          parent_meter_id?: string | null
          tenant_id?: string | null
          location_description?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      billing_periods: {
        Row: {
          id: string
          month: number
          year: number
          status: 'open' | 'closed'
          unit_price_gas: number | null
          unit_price_electricity: number | null
          unit_price_water: number | null
          total_invoice_gas: number | null
          total_invoice_electricity: number | null
          total_invoice_water: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          month: number
          year: number
          status?: 'open' | 'closed'
          unit_price_gas?: number | null
          unit_price_electricity?: number | null
          unit_price_water?: number | null
          total_invoice_gas?: number | null
          total_invoice_electricity?: number | null
          total_invoice_water?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          month?: number
          year?: number
          status?: 'open' | 'closed'
          unit_price_gas?: number | null
          unit_price_electricity?: number | null
          unit_price_water?: number | null
          total_invoice_gas?: number | null
          total_invoice_electricity?: number | null
          total_invoice_water?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      readings: {
        Row: {
          id: string
          meter_id: string
          billing_period_id: string
          date_taken: string
          value: number
          photo_url: string | null
          note: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          meter_id: string
          billing_period_id: string
          date_taken?: string
          value: number
          photo_url?: string | null
          note?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          meter_id?: string
          billing_period_id?: string
          date_taken?: string
          value?: number
          photo_url?: string | null
          note?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

