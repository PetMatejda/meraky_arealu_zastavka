'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Camera, Upload, Save, AlertCircle } from 'lucide-react'
import { extractMeterData } from '@/lib/utils/ocr'
import { cn } from '@/lib/utils/cn'
import type { BillingPeriod, Meter, Reading } from '@/lib/types/database'

export default function ReadingsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [selectedMeter, setSelectedMeter] = useState<string>('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [previousValue, setPreviousValue] = useState<number | null>(null)
  const [newValue, setNewValue] = useState<string>('')
  const [note, setNote] = useState<string>('')
  const [isProcessingOCR, setIsProcessingOCR] = useState(false)
  const [ocrProgress, setOcrProgress] = useState<number>(0)
  const [ocrResult, setOcrResult] = useState<{ serialNumber: string | null; value: number | null; confidence: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  // Fetch meters with initial state info
  const { data: meters } = useQuery({
    queryKey: ['meters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meters')
        .select('*')
        .order('serial_number')
        
      if (error) throw error
      return data as Meter[]
    },
  })

  // Fetch previous reading when meter and period are selected
  // Also check for initial state
  const { data: previousReadingData } = useQuery({
    queryKey: ['previous-reading', selectedMeter, selectedPeriod],
    queryFn: async () => {
      if (!selectedMeter || !selectedPeriod) return { reading: null, meter: null }

      // Get meter data to check for initial state
      const meter = meters?.find(m => m.id === selectedMeter)
      if (!meter) return { reading: null, meter: null }

      // Get current period
      const currentPeriod = billingPeriods?.find(p => p.id === selectedPeriod)
      if (!currentPeriod) return { reading: null, meter }

      // Check if current period is the start period or after it
      const isStartPeriod = meter.start_period_id === selectedPeriod
      const isAfterStartPeriod = meter.start_period_id && meter.start_value !== null
        ? (() => {
            const startPeriod = billingPeriods?.find(p => p.id === meter.start_period_id)
            if (!startPeriod) return false
            return (
              currentPeriod.year > startPeriod.year ||
              (currentPeriod.year === startPeriod.year && currentPeriod.month > startPeriod.month)
            )
          })()
        : false

      // If this is the start period or after, and we have start_value, use it
      if (isStartPeriod && meter.start_value !== null) {
        return {
          reading: {
            value: meter.start_value,
            isInitialState: true,
          } as any,
          meter,
        }
      }

      // Get previous period
      let prevMonth = currentPeriod.month - 1
      let prevYear = currentPeriod.year
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

      if (!prevPeriod) {
        // No previous period - check if we should use initial state
        if (isAfterStartPeriod) {
          // Find the start period reading or use start_value
          if (meter.start_period_id) {
            const { data: startReading } = await supabase
              .from('readings')
              .select('*')
              .eq('meter_id', selectedMeter)
              .eq('billing_period_id', meter.start_period_id)
              .single()
            
            if (startReading) {
              return { reading: startReading as Reading, meter }
            } else if (meter.start_value !== null) {
              return {
                reading: {
                  value: meter.start_value,
                  isInitialState: true,
                } as any,
                meter,
              }
            }
          }
        }
        return { reading: null, meter }
      }

      const prevPeriodId = (prevPeriod as { id: string } | null)?.id
      if (!prevPeriodId) return { reading: null, meter }
      
      // Check if previous period is before start period - if so, use start_value
      if (meter.start_period_id && meter.start_value !== null) {
        const startPeriod = billingPeriods?.find(p => p.id === meter.start_period_id)
        if (startPeriod) {
          const isPrevBeforeStart = 
            prevYear < startPeriod.year ||
            (prevYear === startPeriod.year && prevMonth < startPeriod.month)
          
          if (isPrevBeforeStart) {
            // Previous period is before start, but we're after start - use start period reading or start_value
            const { data: startReading } = await supabase
              .from('readings')
              .select('*')
              .eq('meter_id', selectedMeter)
              .eq('billing_period_id', meter.start_period_id)
              .single()
            
            if (startReading) {
              return { reading: startReading as Reading, meter }
            } else {
              return {
                reading: {
                  value: meter.start_value,
                  isInitialState: true,
                } as any,
                meter,
              }
            }
          }
        }
      }
      
      const { data, error } = await supabase
        .from('readings')
        .select('*')
        .eq('meter_id', selectedMeter)
        .eq('billing_period_id', prevPeriodId)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
      
      // If no previous reading found, check if we should use initial state
      if (!data && meter.start_period_id && meter.start_value !== null) {
        const startPeriod = billingPeriods?.find(p => p.id === meter.start_period_id)
        if (startPeriod) {
          const isCurrentAfterStart = 
            currentPeriod.year > startPeriod.year ||
            (currentPeriod.year === startPeriod.year && currentPeriod.month > startPeriod.month)
          
          if (isCurrentAfterStart) {
            // Check if there's a reading for start period
            const { data: startReading } = await supabase
              .from('readings')
              .select('*')
              .eq('meter_id', selectedMeter)
              .eq('billing_period_id', meter.start_period_id)
              .single()
            
            if (startReading) {
              return { reading: startReading as Reading, meter }
            } else {
              return {
                reading: {
                  value: meter.start_value,
                  isInitialState: true,
                } as any,
                meter,
              }
            }
          }
        }
      }
      
      return { reading: data as Reading | null, meter }
    },
    enabled: !!selectedMeter && !!selectedPeriod,
  })

  // Update previous value when previous reading is loaded
  useEffect(() => {
    if (previousReadingData?.reading) {
      setPreviousValue(previousReadingData.reading.value)
    } else {
      setPreviousValue(null)
    }
  }, [previousReadingData])

  // Handle photo capture
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPhoto(file)
    setError(null)
    setOcrProgress(0)
    setOcrResult(null)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Process OCR
    setIsProcessingOCR(true)
    try {
      const result = await extractMeterData(file, (progress) => {
        setOcrProgress(progress)
      })
      setOcrResult(result)

      // Auto-select meter if serial number found
      if (result.serialNumber && meters) {
        const matchingMeter = meters.find(
          m => m.serial_number.toLowerCase().includes(result.serialNumber!.toLowerCase())
        )
        if (matchingMeter) {
          setSelectedMeter(matchingMeter.id)
        }
      }

      // Auto-fill value if found
      if (result.value !== null) {
        setNewValue(result.value.toString())
      }
    } catch (err) {
      console.error('OCR error:', err)
      setError('Chyba při zpracování OCR')
    } finally {
      setIsProcessingOCR(false)
      setOcrProgress(0)
    }
  }

  // Calculate consumption
  const consumption = previousValue !== null && newValue 
    ? parseFloat(newValue) - previousValue 
    : null

  // Validate: new value should be >= previous value (unless confirmed)
  const isValid = newValue && (
    previousValue === null || 
    parseFloat(newValue) >= previousValue
  )

  // Save reading mutation
  const saveReadingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMeter || !selectedPeriod || !newValue) {
        throw new Error('Vyplňte všechny povinné údaje')
      }

      const value = parseFloat(newValue)
      if (isNaN(value)) {
        throw new Error('Neplatná hodnota odečtu')
      }

      // Upload photo if exists
      let photoUrl: string | null = null
      if (photo) {
        const fileExt = photo.name.split('.').pop()
        const fileName = `${selectedMeter}-${Date.now()}.${fileExt}`
        const filePath = `readings/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('meter-photos')
          .upload(filePath, photo)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          // Continue without photo if upload fails
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('meter-photos')
            .getPublicUrl(filePath)
          photoUrl = publicUrl
        }
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      // Save reading
      const { data, error } = await supabase
        .from('readings')
        .insert({
          meter_id: selectedMeter,
          billing_period_id: selectedPeriod,
          value: value,
          photo_url: photoUrl,
          note: note || null,
          created_by: user?.id || null,
        } as any)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readings'] })
      queryClient.invalidateQueries({ queryKey: ['previous-reading'] })
      
      // Reset form
      setPhoto(null)
      setPhotoPreview(null)
      setNewValue('')
      setNote('')
      setOcrResult(null)
      setError(null)
      
      alert('Odečet byl úspěšně uložen!')
    },
    onError: (error: Error) => {
      setError(error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid && previousValue !== null) {
      const confirmed = window.confirm(
        'Nový stav je menší než předchozí. Pokračovat? (Měřák mohl být vyměněn nebo přetočen)'
      )
      if (!confirmed) return
    }
    saveReadingMutation.mutate()
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mobilní odečet</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">Vyfotografujte měřák a zadejte hodnotu</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Billing Period Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Fakturační období</CardTitle>
            <CardDescription>Vyberte měsíc a rok pro odečet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="period">Období</Label>
                <Select
                  id="period"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  required
                  className="mt-1"
                >
                  <option value="">Vyberte období</option>
                  {billingPeriods?.map((period) => (
                    <option key={period.id} value={period.id}>
                      {period.month}/{period.year} {period.status === 'closed' ? '(uzavřeno)' : ''}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photo Capture */}
        <Card>
          <CardHeader>
            <CardTitle>Fotografie měřáku</CardTitle>
            <CardDescription>Vyfotografujte měřák pro automatické rozpoznání</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50">
                {photoPreview ? (
                  <div className="space-y-4 w-full">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full max-w-md mx-auto rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setPhoto(null)
                        setPhotoPreview(null)
                        setOcrResult(null)
                        setOcrProgress(0)
                        setError(null)
                      }}
                      className="w-full"
                      disabled={isProcessingOCR}
                    >
                      Změnit fotografii
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoCapture}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center">
                      <Camera className="h-12 w-12 text-gray-400 mb-4" />
                      <span className="text-sm font-medium text-gray-700">
                        Klikněte pro pořízení fotografie
                      </span>
                      <span className="text-xs text-gray-500 mt-2">
                        nebo použijte tlačítko kamery
                      </span>
                    </div>
                  </label>
                )}
              </div>

              {isProcessingOCR && (
                <div className="space-y-2">
                  <div className="text-sm text-gray-600 text-center">
                    Zpracovávání OCR... {ocrProgress > 0 && `${Math.round(ocrProgress)}%`}
                  </div>
                  {ocrProgress > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${ocrProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {ocrResult && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">OCR výsledky:</p>
                  {ocrResult.serialNumber && (
                    <p className="text-sm text-blue-700">
                      Sériové číslo: {ocrResult.serialNumber}
                    </p>
                  )}
                  {ocrResult.value !== null && (
                    <p className="text-sm text-blue-700">
                      Hodnota: {ocrResult.value.toFixed(3)}
                    </p>
                  )}
                  {ocrResult.confidence > 0 && (
                    <p className="text-xs text-blue-600 mt-1">
                      Spolehlivost: {Math.round(ocrResult.confidence)}%
                    </p>
                  )}
                  {!ocrResult.serialNumber && ocrResult.value === null && (
                    <p className="text-sm text-blue-600 italic">
                      Nepodařilo se rozpoznat hodnoty. Zkontrolujte kvalitu fotografie a zkuste znovu.
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Meter Selection and Values */}
        <Card>
          <CardHeader>
            <CardTitle>Odečet hodnot</CardTitle>
            <CardDescription>Vyberte měřák a zadejte hodnotu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="meter">Měřák</Label>
                <Select
                  id="meter"
                  value={selectedMeter}
                  onChange={(e) => setSelectedMeter(e.target.value)}
                  required
                  className="mt-1"
                >
                  <option value="">Vyberte měřák</option>
                  {meters?.map((meter) => (
                    <option key={meter.id} value={meter.id}>
                      {meter.serial_number} - {meter.media_type} {meter.location_description ? `(${meter.location_description})` : ''}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="previous">Předchozí stav</Label>
                  <Input
                    id="previous"
                    type="number"
                    value={previousValue ?? ''}
                    readOnly
                    className="mt-1 bg-gray-100"
                  />
                  {previousValue === null && (
                    <p className="text-xs text-gray-500 mt-1">Žádný předchozí odečet</p>
                  )}
                  {previousReadingData?.reading && (previousReadingData.reading as any).isInitialState && (
                    <p className="text-xs text-blue-600 mt-1">Počáteční stav měřáku</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="new">Nový stav *</Label>
                  <Input
                    id="new"
                    type="number"
                    step="0.001"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    required
                    className={cn(
                      "mt-1",
                      !isValid && previousValue !== null && "border-red-500"
                    )}
                  />
                  {!isValid && previousValue !== null && (
                    <p className="text-xs text-red-500 mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Menší než předchozí
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="consumption">Spotřeba</Label>
                  <Input
                    id="consumption"
                    type="number"
                    value={consumption !== null ? consumption.toFixed(3) : ''}
                    readOnly
                    className="mt-1 bg-gray-100"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="note">Poznámka</Label>
                <Input
                  id="note"
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Volitelná poznámka k odečtu"
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            disabled={!selectedMeter || !selectedPeriod || !newValue || saveReadingMutation.isPending}
            className="w-full sm:w-auto sm:min-w-[200px]"
          >
            {saveReadingMutation.isPending ? (
              'Ukládání...'
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Uložit odečet
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

