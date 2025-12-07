'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Plus, Save } from 'lucide-react'
import type { BillingPeriod, Tenant } from '@/lib/types/database'

export default function SettingsPage() {
  const [isCreatingPeriod, setIsCreatingPeriod] = useState(false)
  const [isCreatingTenant, setIsCreatingTenant] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<BillingPeriod | null>(null)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const queryClient = useQueryClient()

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

  // Fetch tenants
  const { data: tenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('company_name')
      
      if (error) throw error
      return data as Tenant[]
    },
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Nastavení</h1>
        <p className="text-gray-600 mt-2">Správa fakturačních období a podnájemců</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Billing Periods */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Fakturační období</CardTitle>
                <CardDescription>Správa měsíčních fakturačních období</CardDescription>
              </div>
              <Button onClick={() => setIsCreatingPeriod(true)} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nové období
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {billingPeriods?.map((period) => (
                <div
                  key={period.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {period.month}/{period.year}
                    </p>
                    <p className="text-sm text-gray-500">
                      Status: {period.status === 'open' ? 'Otevřeno' : 'Uzavřeno'}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditingPeriod(period)}
                  >
                    Upravit
                  </Button>
                </div>
              ))}
              {(!billingPeriods || billingPeriods.length === 0) && (
                <p className="text-gray-500 text-center py-4">
                  Zatím nejsou žádná období
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tenants */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Podnájemci</CardTitle>
                <CardDescription>Správa podnájemců</CardDescription>
              </div>
              <Button onClick={() => setIsCreatingTenant(true)} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nový podnájemce
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tenants?.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{tenant.company_name}</p>
                    {tenant.ico && (
                      <p className="text-sm text-gray-500">IČO: {tenant.ico}</p>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditingTenant(tenant)}
                  >
                    Upravit
                  </Button>
                </div>
              ))}
              {(!tenants || tenants.length === 0) && (
                <p className="text-gray-500 text-center py-4">
                  Zatím nejsou žádní podnájemci
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Period Modal */}
      {(isCreatingPeriod || editingPeriod) && (
        <BillingPeriodForm
          period={editingPeriod}
          onClose={() => {
            setIsCreatingPeriod(false)
            setEditingPeriod(null)
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['billing-periods'] })
            setIsCreatingPeriod(false)
            setEditingPeriod(null)
          }}
        />
      )}

      {/* Create/Edit Tenant Modal */}
      {(isCreatingTenant || editingTenant) && (
        <TenantForm
          tenant={editingTenant}
          onClose={() => {
            setIsCreatingTenant(false)
            setEditingTenant(null)
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['tenants'] })
            setIsCreatingTenant(false)
            setEditingTenant(null)
          }}
        />
      )}
    </div>
  )
}

function BillingPeriodForm({
  period,
  onClose,
  onSuccess,
}: {
  period?: BillingPeriod | null
  onClose: () => void
  onSuccess: () => void
}) {
  const currentDate = new Date()
  const [formData, setFormData] = useState({
    month: period?.month || currentDate.getMonth() + 1,
    year: period?.year || currentDate.getFullYear(),
    unit_price_gas: period?.unit_price_gas?.toString() || '',
    unit_price_electricity: period?.unit_price_electricity?.toString() || '',
    unit_price_water: period?.unit_price_water?.toString() || '',
    total_invoice_gas: period?.total_invoice_gas?.toString() || '',
    total_invoice_electricity: period?.total_invoice_electricity?.toString() || '',
    total_invoice_water: period?.total_invoice_water?.toString() || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const data = {
      month: formData.month,
      year: formData.year,
      unit_price_gas: formData.unit_price_gas ? parseFloat(formData.unit_price_gas) : null,
      unit_price_electricity: formData.unit_price_electricity ? parseFloat(formData.unit_price_electricity) : null,
      unit_price_water: formData.unit_price_water ? parseFloat(formData.unit_price_water) : null,
      total_invoice_gas: formData.total_invoice_gas ? parseFloat(formData.total_invoice_gas) : null,
      total_invoice_electricity: formData.total_invoice_electricity ? parseFloat(formData.total_invoice_electricity) : null,
      total_invoice_water: formData.total_invoice_water ? parseFloat(formData.total_invoice_water) : null,
    }

    let error: any
    if (period) {
      // Update existing period
      const { error: updateError } = await supabase
        .from('billing_periods')
        // @ts-ignore - Supabase types issue
        .update(data as any)
        .eq('id', period.id)
      error = updateError
    } else {
      // Create new period
      const { error: insertError } = await supabase
        .from('billing_periods')
        // @ts-ignore - Supabase types issue
        .insert(data as any)
      error = insertError
    }

    if (error) {
      alert(`Chyba při ${period ? 'úpravě' : 'vytváření'}: ` + error.message)
      return
    }

    onSuccess()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{period ? 'Upravit fakturační období' : 'Nové fakturační období'}</CardTitle>
          <CardDescription>{period ? 'Upravte fakturační období' : 'Vytvořte nové fakturační období'}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="month">Měsíc *</Label>
                <Select
                  id="month"
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                  required
                  className="mt-1"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="year">Rok *</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  required
                  className="mt-1"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Ceny za jednotku</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="unit_price_gas">Plyn</Label>
                  <Input
                    id="unit_price_gas"
                    type="number"
                    step="0.0001"
                    value={formData.unit_price_gas}
                    onChange={(e) => setFormData({ ...formData, unit_price_gas: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="unit_price_electricity">Elektřina</Label>
                  <Input
                    id="unit_price_electricity"
                    type="number"
                    step="0.0001"
                    value={formData.unit_price_electricity}
                    onChange={(e) => setFormData({ ...formData, unit_price_electricity: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="unit_price_water">Voda</Label>
                  <Input
                    id="unit_price_water"
                    type="number"
                    step="0.0001"
                    value={formData.unit_price_water}
                    onChange={(e) => setFormData({ ...formData, unit_price_water: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Celkové faktury od dodavatele</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="total_invoice_gas">Plyn</Label>
                  <Input
                    id="total_invoice_gas"
                    type="number"
                    step="0.01"
                    value={formData.total_invoice_gas}
                    onChange={(e) => setFormData({ ...formData, total_invoice_gas: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="total_invoice_electricity">Elektřina</Label>
                  <Input
                    id="total_invoice_electricity"
                    type="number"
                    step="0.01"
                    value={formData.total_invoice_electricity}
                    onChange={(e) => setFormData({ ...formData, total_invoice_electricity: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="total_invoice_water">Voda</Label>
                  <Input
                    id="total_invoice_water"
                    type="number"
                    step="0.01"
                    value={formData.total_invoice_water}
                    onChange={(e) => setFormData({ ...formData, total_invoice_water: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Zrušit
              </Button>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Vytvořit
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function TenantForm({
  tenant,
  onClose,
  onSuccess,
}: {
  tenant?: Tenant | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    company_name: tenant?.company_name || '',
    ico: tenant?.ico || '',
    contact_email: tenant?.contact_email || '',
    contact_phone: tenant?.contact_phone || '',
    address: tenant?.address || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const data = {
      company_name: formData.company_name,
      ico: formData.ico || null,
      contact_email: formData.contact_email || null,
      contact_phone: formData.contact_phone || null,
      address: formData.address || null,
    }

    let error: any
    if (tenant) {
      // Update existing tenant
      const { error: updateError } = await supabase
        .from('tenants')
        // @ts-ignore - Supabase types issue
        .update(data as any)
        .eq('id', tenant.id)
      error = updateError
    } else {
      // Create new tenant
      const { error: insertError } = await supabase
        .from('tenants')
        // @ts-ignore - Supabase types issue
        .insert(data as any)
      error = insertError
    }

    if (error) {
      alert(`Chyba při ${tenant ? 'úpravě' : 'vytváření'}: ` + error.message)
      return
    }

    onSuccess()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{tenant ? 'Upravit podnájemce' : 'Nový podnájemce'}</CardTitle>
          <CardDescription>{tenant ? 'Upravte údaje o podnájemci' : 'Přidejte nového podnájemce'}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="company_name">Název firmy *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="ico">IČO</Label>
              <Input
                id="ico"
                value={formData.ico}
                onChange={(e) => setFormData({ ...formData, ico: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="contact_email">Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="contact_phone">Telefon</Label>
              <Input
                id="contact_phone"
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="address">Adresa</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Zrušit
              </Button>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                {tenant ? 'Uložit změny' : 'Vytvořit'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

