'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Download } from 'lucide-react'
import type { BillingPeriod, Meter, Reading, Tenant } from '@/lib/types/database'

interface BillingReportRow {
  tenant: Tenant | null
  meter: Meter
  previous_reading: Reading | null
  current_reading: Reading | null
  consumption: number
  unit_price: number
  total: number
}

export default function BillingPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')

  // Fetch billing periods
  const { data: billingPeriods } = useQuery({
    queryKey: ['billing-periods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('billing_periods')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false })
      
      if (error) throw error
      return data as BillingPeriod[]
    },
  })

  // Fetch billing report
  const { data: report, isLoading } = useQuery({
    queryKey: ['billing-report', selectedPeriod],
    queryFn: async () => {
      if (!selectedPeriod) return []

      const period = billingPeriods?.find(p => p.id === selectedPeriod)
      if (!period) return []

      // Get previous period
      let prevMonth = period.month - 1
      let prevYear = period.year
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

      // Get all meters with tenants
      const { data: meters } = await supabase
        .from('meters')
        .select('*, tenant:tenants(*)')
        .not('tenant_id', 'is', null)

      if (!meters) return []

      // Get readings for current and previous period
      const { data: currentReadingsData } = await supabase
        .from('readings')
        .select('*')
        .eq('billing_period_id', selectedPeriod)
      const currentReadings: Reading[] = currentReadingsData || []

      let prevReadings: Reading[] | null = null
      if (prevPeriod) {
        const prevPeriodId = (prevPeriod as { id: string }).id
        if (prevPeriodId) {
          const { data: prevReadingsData } = await supabase
            .from('readings')
            .select('*')
            .eq('billing_period_id', prevPeriodId)
          prevReadings = prevReadingsData || null
        }
      }

      // Build report
      const reportRows: BillingReportRow[] = []

      for (const meter of meters as (Meter & { tenant: Tenant | null })[]) {
        const currentReading = currentReadings?.find(r => r.meter_id === meter.id)
        const prevReading = prevReadings?.find(r => r.meter_id === meter.id)

        if (!currentReading) continue // Skip if no reading for this period

        // Calculate consumption - use initial state if applicable
        let consumption: number
        if (prevReading) {
          consumption = currentReading.value - prevReading.value
        } else {
          // No previous reading - check if we should use initial state
          if (meter.start_period_id && meter.start_value !== null) {
            const startPeriod = billingPeriods?.find(p => p.id === meter.start_period_id)
            if (startPeriod) {
              const isCurrentAfterStart = 
                period.year > startPeriod.year ||
                (period.year === startPeriod.year && period.month > startPeriod.month)
              
              if (isCurrentAfterStart) {
                // Check if there's a reading for start period
                const startReading = currentReadings?.find(r => 
                  r.meter_id === meter.id && r.billing_period_id === meter.start_period_id
                ) || prevReadings?.find(r => 
                  r.meter_id === meter.id && r.billing_period_id === meter.start_period_id
                )
                
                if (startReading) {
                  consumption = currentReading.value - startReading.value
                } else {
                  consumption = currentReading.value - meter.start_value
                }
              } else {
                consumption = currentReading.value
              }
            } else {
              consumption = currentReading.value
            }
          } else {
            consumption = currentReading.value
          }
        }

        const unitPrice = 
          meter.media_type === 'gas' ? period.unit_price_gas || 0 :
          meter.media_type === 'electricity' ? period.unit_price_electricity || 0 :
          period.unit_price_water || 0

        const total = consumption * unitPrice

        reportRows.push({
          tenant: meter.tenant,
          meter,
          previous_reading: prevReading || null,
          current_reading: currentReading,
          consumption,
          unit_price: unitPrice,
          total,
        })
      }

      return reportRows
    },
    enabled: !!selectedPeriod && !!billingPeriods,
  })

  const handleExportCSV = () => {
    if (!report || report.length === 0) return

    const headers = [
      'Podnájemce',
      'IČO',
      'Měřák',
      'Typ média',
      'Předchozí stav',
      'Aktuální stav',
      'Spotřeba',
      'Cena/jednotka',
      'Celkem',
    ]

    const rows = report.map(row => [
      row.tenant?.company_name || '-',
      row.tenant?.ico || '-',
      row.meter.serial_number,
      row.meter.media_type === 'gas' ? 'Plyn' :
        row.meter.media_type === 'electricity' ? 'Elektřina' : 'Voda',
      row.previous_reading?.value.toFixed(3) || '-',
      row.current_reading?.value.toFixed(3) || '-',
      row.consumption.toFixed(3),
      row.unit_price.toFixed(4),
      row.total.toFixed(2),
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `rozuctovani-${selectedPeriod}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const totalAmount = report?.reduce((sum, row) => sum + row.total, 0) || 0

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rozúčtování nákladů</h1>
          <p className="text-gray-600 mt-2">Přehled a export fakturace pro podnájemce</p>
        </div>
        {report && report.length > 0 && (
          <Button onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exportovat CSV
          </Button>
        )}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Vyberte fakturační období</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="max-w-xs"
          >
            <option value="">Vyberte období</option>
            {billingPeriods?.map((period) => (
              <option key={period.id} value={period.id}>
                {period.month}/{period.year} {period.status === 'closed' ? '(uzavřeno)' : ''}
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="text-center py-8">Načítání...</div>
      )}

      {!selectedPeriod && (
        <div className="text-center py-8 text-gray-500">
          Vyberte fakturační období pro zobrazení rozúčtování
        </div>
      )}

      {selectedPeriod && report && report.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          Pro toto období nejsou žádné odečty
        </div>
      )}

      {report && report.length > 0 && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Přehled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Počet podnájemců</p>
                  <p className="text-2xl font-bold">
                    {new Set(report.map(r => r.tenant?.id).filter(Boolean)).size}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Počet měřáků</p>
                  <p className="text-2xl font-bold">{report.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Celková spotřeba</p>
                  <p className="text-2xl font-bold">
                    {report.reduce((sum, r) => sum + r.consumption, 0).toFixed(3)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Celkem k úhradě</p>
                  <p className="text-2xl font-bold text-primary">
                    {totalAmount.toFixed(2)} Kč
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detailní rozúčtování</CardTitle>
              <CardDescription>Tabulka s podrobným přehledem pro každého podnájemce</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">Podnájemce</th>
                      <th className="text-left p-3 font-semibold">Měřák</th>
                      <th className="text-right p-3 font-semibold">Počáteční stav</th>
                      <th className="text-right p-3 font-semibold">Konečný stav</th>
                      <th className="text-right p-3 font-semibold">Spotřeba</th>
                      <th className="text-right p-3 font-semibold">Cena/jednotka</th>
                      <th className="text-right p-3 font-semibold">Celkem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.map((row, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{row.tenant?.company_name || '-'}</p>
                            {row.tenant?.ico && (
                              <p className="text-sm text-gray-500">IČO: {row.tenant.ico}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{row.meter.serial_number}</p>
                            <p className="text-sm text-gray-500">
                              {row.meter.media_type === 'gas' && 'Plyn'}
                              {row.meter.media_type === 'electricity' && 'Elektřina'}
                              {row.meter.media_type === 'water' && 'Voda'}
                            </p>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          {row.previous_reading?.value.toFixed(3) || '-'}
                        </td>
                        <td className="p-3 text-right">
                          {row.current_reading?.value.toFixed(3)}
                        </td>
                        <td className="p-3 text-right">
                          {row.consumption.toFixed(3)}
                        </td>
                        <td className="p-3 text-right">
                          {row.unit_price.toFixed(4)} Kč
                        </td>
                        <td className="p-3 text-right font-semibold">
                          {row.total.toFixed(2)} Kč
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-gray-800 font-bold">
                      <td colSpan={6} className="p-3 text-right">
                        Celkem:
                      </td>
                      <td className="p-3 text-right text-primary">
                        {totalAmount.toFixed(2)} Kč
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

