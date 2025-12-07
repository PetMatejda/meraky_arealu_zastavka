import Tesseract from 'tesseract.js'

export interface OCRResult {
  serialNumber: string | null
  value: number | null
  confidence: number
}

/**
 * Extract meter data from image using OCR
 */
export async function extractMeterData(
  imageFile: File,
  onProgress?: (progress: number) => void
): Promise<OCRResult> {
  try {
    console.log('OCR processing image:', imageFile.name)
    
    // Process image with Tesseract.js
    const { data: { text, confidence } } = await Tesseract.recognize(imageFile, 'eng+ces', {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          const progress = m.progress * 100
          onProgress(progress)
          console.log(`OCR Progress: ${Math.round(progress)}%`)
        }
      },
    })
    
    console.log('OCR Text:', text)
    console.log('OCR Confidence:', confidence)
    
    // Extract serial number and value
    const serialNumber = extractSerialNumber(text)
    const value = extractValue(text)
    
    return {
      serialNumber,
      value,
      confidence: confidence || 0,
    }
  } catch (error) {
    console.error('OCR error:', error)
    return {
      serialNumber: null,
      value: null,
      confidence: 0,
    }
  }
}

/**
 * Extract serial number from OCR text
 */
export function extractSerialNumber(text: string): string | null {
  // Pattern matching for common meter serial number formats
  const patterns = [
    /\b[A-Z]{2,4}\d{6,10}\b/i, // e.g., ABC123456, abc123456
    /\b\d{8,12}\b/, // e.g., 123456789012
    /SN[:\s]*([A-Z0-9]{6,12})/i, // Serial Number: ABC123
    /Sériové[:\s]*č[íi]slo[:\s]*([A-Z0-9]{6,12})/i, // Czech format
    /\b[A-Z]{1,3}-?\d{6,10}\b/i, // e.g., A-123456, AB-123456
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      // Return captured group if available, otherwise the full match
      return match[1] || match[0]
    }
  }
  
  return null
}

/**
 * Extract numeric value from OCR text (meter reading)
 * Looks for largest number that could be a meter reading
 */
export function extractValue(text: string): number | null {
  // Remove common OCR errors (O -> 0, I -> 1, etc.)
  let cleanedText = text
    .replace(/[Oo]/g, '0')
    .replace(/[Il]/g, '1')
    .replace(/[Ss]/g, '5')
    .replace(/[Zz]/g, '2')
  
  // Look for decimal numbers (meter readings) - prefer larger numbers
  const patterns = [
    /\b\d{4,10}\.?\d{0,3}\b/g, // e.g., 12345.678 or 12345678
    /\b\d+,\d{1,3}\b/g, // Czech format: 12345,678
  ]
  
  const allNumbers: number[] = []
  
  for (const pattern of patterns) {
    const matches = cleanedText.match(pattern)
    if (matches) {
      for (const match of matches) {
        // Replace comma with dot for Czech format
        const numStr = match.replace(',', '.')
        const value = parseFloat(numStr)
        if (!isNaN(value) && value > 0) {
          allNumbers.push(value)
        }
      }
    }
  }
  
  if (allNumbers.length === 0) {
    return null
  }
  
  // Return the largest number (most likely to be the meter reading)
  // Meter readings are typically 4-8 digits
  const validReadings = allNumbers.filter(n => n >= 1000 && n < 999999999)
  
  if (validReadings.length > 0) {
    return Math.max(...validReadings)
  }
  
  // Fallback to largest number if no valid reading found
  return Math.max(...allNumbers)
}

