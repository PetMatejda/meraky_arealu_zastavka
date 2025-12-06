'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Plus, Edit, Trash2, Gauge } from 'lucide-react'
import type { Meter, Tenant } from '@/lib/types/database'

export default function MetersPage() {
  const [isCreating, setIsCreating] = useState(false)
  const [editingMeter, setEditingMeter] = useState<Meter | null>(null)
  const queryClient = useQueryClient()

  // Fetch meters with hierarchy
  const { data: meters, isLoading } = useQuery({
    queryKey: ['meters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meters')
        .select('*, tenant:tenants(*)')
        .order('serial_number')
      
      if (error) throw error
      return data as (Meter & { tenant: Tenant | null })[]
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

  // Build hierarchy tree
  const buildHierarchy = (allMeters: (Meter & { tenant: Tenant | null })[]) => {
    const meterMap = new Map(allMeters.map(m => [m.id, { ...m, children: [] }]))
    const roots: (Meter & { tenant: Tenant | null; children: any[] })[] = []

    allMeters.forEach(meter => {
      const node = meterMap.get(meter.id)!
      if (meter.parent_meter_id) {
        const parent = meterMap.get(meter.parent_meter_id)
        if (parent) {
          parent.children.push(node)
        }
      } else {
        roots.push(node)
      }
    })

    return roots
  }

  const meterTree = meters ? buildHierarchy(meters) : []

  const renderMeterTree = (nodes: (Meter & { tenant: Tenant | null; children: any[] })[], depth = 0) => {
    if (depth > 3) return null // Max depth 4

    return (
      <div className="space-y-2">
        {nodes.map((meter) => (
          <div key={meter.id} className="border rounded-lg p-4 bg-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold text-lg">
                      {meter.serial_number}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {meter.media_type === 'gas' && 'Plyn'}
                      {meter.media_type === 'electricity' && 'Elektřina'}
                      {meter.media_type === 'water' && 'Voda'}
                      {meter.location_description && ` • ${meter.location_description}`}
                    </p>
                    {meter.tenant && (
                      <p className="text-sm text-gray-500 mt-1">
                        Podnájemce: {meter.tenant.company_name}
                      </p>
                    )}
                    {meter.notes && (
                      <p className="text-sm text-gray-500 mt-1">{meter.notes}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingMeter(meter)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(meter.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {meter.children.length > 0 && (
              <div className="mt-4 ml-6 border-l-2 border-gray-200 pl-4">
                {renderMeterTree(meter.children, depth + 1)}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Opravdu chcete smazat tento měřák?')) return

    const { error } = await supabase
      .from('meters')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Chyba při mazání: ' + error.message)
    } else {
      queryClient.invalidateQueries({ queryKey: ['meters'] })
    }
  }

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Načítání...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Měřáky</h1>
          <p className="text-gray-600 mt-2">Správa hierarchie měřáků</p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Přidat měřák
        </Button>
      </div>

      {/* Meter Tree */}
      <Card>
        <CardHeader>
          <CardTitle>Hierarchie měřáků</CardTitle>
          <CardDescription>Stromová struktura měřáků (max 4 úrovně)</CardDescription>
        </CardHeader>
        <CardContent>
          {meterTree.length > 0 ? (
            renderMeterTree(meterTree)
          ) : (
            <p className="text-gray-500 text-center py-8">
              Zatím nejsou žádné měřáky. Přidejte první měřák.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {(isCreating || editingMeter) && (
        <MeterForm
          meter={editingMeter}
          tenants={tenants || []}
          allMeters={meters || []}
          onClose={() => {
            setIsCreating(false)
            setEditingMeter(null)
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['meters'] })
            setIsCreating(false)
            setEditingMeter(null)
          }}
        />
      )}
    </div>
  )
}

function MeterForm({
  meter,
  tenants,
  allMeters,
  onClose,
  onSuccess,
}: {
  meter: Meter | null
  tenants: Tenant[]
  allMeters: (Meter & { tenant: Tenant | null })[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    serial_number: meter?.serial_number || '',
    media_type: (meter?.media_type || 'electricity') as 'gas' | 'electricity' | 'water',
    parent_meter_id: meter?.parent_meter_id || '',
    tenant_id: meter?.tenant_id || '',
    location_description: meter?.location_description || '',
    notes: meter?.notes || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const data = {
      ...formData,
      parent_meter_id: formData.parent_meter_id || null,
      tenant_id: formData.tenant_id || null,
      location_description: formData.location_description || null,
      notes: formData.notes || null,
    }

    if (meter) {
      // Update
      const { error } = await supabase
        .from('meters')
        .update(data)
        .eq('id', meter.id)

      if (error) {
        alert('Chyba při aktualizaci: ' + error.message)
        return
      }
    } else {
      // Create
      const { error } = await supabase
        .from('meters')
        .insert(data)

      if (error) {
        alert('Chyba při vytváření: ' + error.message)
        return
      }
    }

    onSuccess()
  }

  // Filter out current meter and its descendants from parent options
  const availableParents = allMeters.filter(m => {
    if (meter && m.id === meter.id) return false
    // TODO: Also filter descendants to prevent cycles
    return true
  })

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{meter ? 'Upravit měřák' : 'Nový měřák'}</CardTitle>
          <CardDescription>Vyplňte údaje o měřáku</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="serial_number">Sériové číslo *</Label>
              <Input
                id="serial_number"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="media_type">Typ média *</Label>
              <Select
                id="media_type"
                value={formData.media_type}
                onChange={(e) => setFormData({ ...formData, media_type: e.target.value as any })}
                required
                className="mt-1"
              >
                <option value="gas">Plyn</option>
                <option value="electricity">Elektřina</option>
                <option value="water">Voda</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="parent_meter_id">Nadřazený měřák</Label>
              <Select
                id="parent_meter_id"
                value={formData.parent_meter_id}
                onChange={(e) => setFormData({ ...formData, parent_meter_id: e.target.value })}
                className="mt-1"
              >
                <option value="">Žádný (kořenový měřák)</option>
                {availableParents.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.serial_number} - {m.media_type}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="tenant_id">Podnájemce</Label>
              <Select
                id="tenant_id"
                value={formData.tenant_id}
                onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                className="mt-1"
              >
                <option value="">Nepřiřazeno</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.company_name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="location_description">Umístění/Popis</Label>
              <Input
                id="location_description"
                value={formData.location_description}
                onChange={(e) => setFormData({ ...formData, location_description: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="notes">Poznámky</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Zrušit
              </Button>
              <Button type="submit">
                {meter ? 'Uložit změny' : 'Vytvořit'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

