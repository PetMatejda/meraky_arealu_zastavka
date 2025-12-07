'use client'

export const dynamic = 'force-dynamic'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Gauge, FileText, Users, TrendingUp } from 'lucide-react'
import type { BillingPeriod, Meter, Reading, Tenant } from '@/lib/types/database'

export default function DashboardPage() {
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  // Fetch all meters
  const { data: meters } = useQuery({
    queryKey: ['dashboard-meters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meters')
        .select('*')
      
      if (error) throw error
      return data as Meter[]
    },
  })

  // Fetch all tenants
  const { data: tenants } = useQuery({
    queryKey: ['dashboard-tenants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
      
      if (error) throw error
      return data as Tenant[]
    },
  })

  // Fetch current month billing period
  const { data: currentPeriod } = useQuery({
    queryKey: ['dashboard-current-period', currentMonth, currentYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('billing_periods')
        .select('*')
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return data as BillingPeriod | null
    },
  })

  // Fetch readings for current month
  const { data: currentMonthReadings } = useQuery({
    queryKey: ['dashboard-current-readings', currentPeriod?.id],
    queryFn: async () => {
      if (!currentPeriod) return []
      
      const { data, error } = await supabase
        .from('readings')
        .select('*, meter:meters(*), billing_period:billing_periods(*)')
        .eq('billing_period_id', currentPeriod.id)
        .order('date_taken', { ascending: false })
      
      if (error) throw error
      return data as (Reading & { meter: Meter; billing_period: BillingPeriod })[]
    },
    enabled: !!currentPeriod,
  })

  // Fetch previous month readings for consumption calculation
  const { data: previousMonthReadings } = useQuery({
    queryKey: ['dashboard-previous-readings', currentMonth, currentYear],
    queryFn: async () => {
      let prevMonth = currentMonth - 1
      let prevYear = currentYear
      if (prevMonth < 1) {
        prevMonth = 12
        prevYear -= 1
      }

      const { data: prevPeriod } = await supabase
        .from('billing_periods')
        .select('id')
        .eq('month', prevMonth)
        .eq('year', prevYear)
        .single()

      if (!prevPeriod) return []

      const prevPeriodId = (prevPeriod as { id: string }).id
      const { data, error } = await supabase
        .from('readings')
        .select('*')
        .eq('billing_period_id', prevPeriodId)
      
      if (error) throw error
      return data as Reading[]
    },
  })

  // Fetch recent readings (last 5)
  const { data: recentReadings } = useQuery({
    queryKey: ['dashboard-recent-readings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('readings')
        .select('*, meter:meters(*), billing_period:billing_periods(*)')
        .order('date_taken', { ascending: false })
        .limit(5)
      
      if (error) throw error
      return data as (Reading & { meter: Meter; billing_period: BillingPeriod })[]
    },
  })

  // Fetch billing periods
  const { data: billingPeriods } = useQuery({
    queryKey: ['dashboard-billing-periods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('billing_periods')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(5)
      
      if (error) throw error
      return data as BillingPeriod[]
    },
  })

  // Calculate consumption for current month
  const currentConsumption = currentMonthReadings?.reduce((sum, reading) => {
    if (!previousMonthReadings) return sum
    
    const prevReading = previousMonthReadings.find(r => r.meter_id === reading.meter_id)
    if (prevReading) {
      return sum + (reading.value - prevReading.value)
    }
    
    // Check for initial state
    const meter = reading.meter
    if (meter.start_period_id && meter.start_value !== null) {
      const startPeriod = billingPeriods?.find(p => p.id === meter.start_period_id)
      if (startPeriod && currentPeriod) {
        const isCurrentAfterStart = 
          currentPeriod.year > startPeriod.year ||
          (currentPeriod.year === startPeriod.year && currentPeriod.month > startPeriod.month)
        
        if (isCurrentAfterStart) {
          return sum + (reading.value - meter.start_value)
        }
      }
    }
    
    return sum + reading.value
  }, 0) || 0

  const totalMeters = meters?.length || 0
  const currentMonthReadingsCount = currentMonthReadings?.length || 0
  const totalTenants = tenants?.length || 0

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">Přehled měřičů a odečtů</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Celkem měřáků</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMeters}</div>
            <p className="text-xs text-muted-foreground">Aktivní měřáky</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Odečty tento měsíc</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMonthReadingsCount}</div>
            <p className="text-xs text-muted-foreground">Z celkového počtu</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Podnájemci</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTenants}</div>
            <p className="text-xs text-muted-foreground">Aktivní podnájemci</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spotřeba</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentConsumption > 0 ? currentConsumption.toFixed(3) : '-'}
            </div>
            <p className="text-xs text-muted-foreground">Tento měsíc</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Nedávné odečty</CardTitle>
            <CardDescription>Poslední provedené odečty měřičů</CardDescription>
          </CardHeader>
          <CardContent>
            {recentReadings && recentReadings.length > 0 ? (
              <div className="space-y-3">
                {recentReadings.map((reading) => (
                  <div key={reading.id} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium">{reading.meter?.serial_number || '-'}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(reading.date_taken).toLocaleDateString('cs-CZ')} • {reading.billing_period?.month}/{reading.billing_period?.year}
                      </p>
                    </div>
                    <p className="font-semibold">{reading.value.toFixed(3)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Zatím žádné odečty</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fakturační období</CardTitle>
            <CardDescription>Aktuální a uzavřená období</CardDescription>
          </CardHeader>
          <CardContent>
            {billingPeriods && billingPeriods.length > 0 ? (
              <div className="space-y-3">
                {billingPeriods.map((period) => (
                  <div key={period.id} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium">
                        {period.month}/{period.year}
                        {period.status === 'open' && (
                          <span className="ml-2 text-xs text-green-600">(otevřeno)</span>
                        )}
                        {period.status === 'closed' && (
                          <span className="ml-2 text-xs text-gray-500">(uzavřeno)</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Zatím žádná období</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

