export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type MediaType = 'gas' | 'electricity' | 'water'

export type BillingPeriodStatus = 'open' | 'closed'

export interface Tenant {
  id: string
  company_name: string
  ico: string | null
  contact_email: string | null
  contact_phone: string | null
  address: string | null
  created_at: string
  updated_at: string
}

export interface Meter {
  id: string
  serial_number: string
  media_type: MediaType
  parent_meter_id: string | null
  tenant_id: string | null
  location_description: string | null
  notes: string | null
  start_value: number | null
  start_period_id: string | null
  created_at: string
  updated_at: string
}

export interface MeterWithRelations extends Meter {
  tenant?: Tenant | null
  parent_meter?: Meter | null
  children?: Meter[]
}

export interface BillingPeriod {
  id: string
  month: number
  year: number
  status: BillingPeriodStatus
  unit_price_gas: number | null
  unit_price_electricity: number | null
  unit_price_water: number | null
  total_invoice_gas: number | null
  total_invoice_electricity: number | null
  total_invoice_water: number | null
  created_at: string
  updated_at: string
}

export interface Reading {
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

export interface ReadingWithRelations extends Reading {
  meter?: Meter
  billing_period?: BillingPeriod
}

export interface BillingReportRow {
  tenant: Tenant | null
  meter: Meter
  previous_reading: Reading | null
  current_reading: Reading
  consumption: number
  unit_price: number
  total: number
}

