// src/lib/terrainExports.ts
import type { Spot, Exposant } from '@/components/TerrainEditor'
import { getCategoryColor, CATEGORY_COLORS } from '@/components/TerrainEditor'

interface ExportOptions {
  eventTitle: string
  spots: Spot[]
  exposants: Exposant[]
  mapElement: HTMLElement
}

// ========== EXPORT PDF ==========
export async function exportToPDF({ eventTitle, spots, exposants, mapElement }: ExportOptions) {
  const html2canvas = (await import('html2canvas')).default
  const { jsPDF } = await import('jspdf')

  // Capture la carte
  const canvas = await html2canvas(mapElement, {
    useCORS: true,
    allowTaint: true,
    scale: 2,
    backgroundColor: '#ffffff',
  })

  const pdf = new jsPDF('landscape', 'mm', 'a4')
  const pageW = 297
  const pageH = 210

  // Header
  pdf.setFillColor(15, 23, 42)
  pdf.rect(0, 0, pageW, 18, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('PulseMarket — Plan d\'attribution', 10, 12)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  pdf.text(new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }), pageW - 50, 12)

  // Titre événement
  pdf.setTextColor(15, 23, 42)
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.text(eventTitle, 10, 26)

  // Calcul taille de la carte
  const mapW = pageW - 20
  const mapH = 130
  const imgData = canvas.toDataURL('image/png')
  pdf.addImage(imgData, 'PNG', 10, 30, mapW, mapH)

  // Légende
  let legendY = 30 + mapH + 5
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(100, 116, 139)
  pdf.text('LÉGENDE CATÉGORIES', 10, legendY)

  let legendX = 10
  legendY += 4
  Object.entries(CATEGORY_COLORS).filter(([k]) => k !== 'default').forEach(([key, c]) => {
    const rgb = hexToRgb(c.bg)
    pdf.setFillColor(rgb.r, rgb.g, rgb.b)
    pdf.rect(legendX, legendY - 2, 3, 3, 'F')
    pdf.setTextColor(15, 23, 42)
    pdf.setFont('helvetica', 'normal')
    pdf.text(c.label, legendX + 5, legendY)
    legendX += pdf.getTextWidth(c.label) + 12
  })

  // Stats
  const placed = spots.filter(s => s.application_id).length
  const empty = spots.filter(s => s.type === 'emplacement' && !s.application_id).length
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(15, 23, 42)
  pdf.text(`${placed} attribué(s) · ${empty} libre(s) · ${spots.length} total`, 10, pageH - 8)

  // Footer
  pdf.setFontSize(7)
  pdf.setTextColor(148, 163, 184)
  pdf.text('Généré par PulseMarket · pulse-market.fr', pageW - 70, pageH - 8)

  // === PAGE 2 : Liste des attributions ===
  pdf.addPage('landscape', 'a4')

  pdf.setFillColor(15, 23, 42)
  pdf.rect(0, 0, pageW, 18, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Liste des attributions', 10, 12)

  pdf.setTextColor(15, 23, 42)
  pdf.setFontSize(11)
  pdf.text(eventTitle, 10, 26)

  // Tableau
  const tableY = 36
  pdf.setFillColor(241, 245, 249)
  pdf.rect(10, tableY, pageW - 20, 7, 'F')
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(100, 116, 139)
  pdf.text('CASE', 12, tableY + 5)
  pdf.text('EXPOSANT', 30, tableY + 5)
  pdf.text('ACTIVITÉ', 90, tableY + 5)
  pdf.text('STAND', 150, tableY + 5)
  pdf.text('EMAIL', 180, tableY + 5)
  pdf.text('TÉL', 240, tableY + 5)

  let rowY = tableY + 12
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(15, 23, 42)

  const assigned = spots.filter(s => s.application_id).sort((a, b) => a.label.localeCompare(b.label))
  assigned.forEach((spot, i) => {
    if (rowY > pageH - 15) {
      pdf.addPage('landscape', 'a4')
      rowY = 20
    }
    if (i % 2 === 0) {
      pdf.setFillColor(249, 250, 251)
      pdf.rect(10, rowY - 4, pageW - 20, 6, 'F')
    }
    const c = getCategoryColor(spot.application?.exposant_data?.category)
    const rgb = hexToRgb(c.bg)
    pdf.setFillColor(rgb.r, rgb.g, rgb.b)
    pdf.rect(12, rowY - 3, 2, 4, 'F')

    pdf.setFontSize(8)
    pdf.text(spot.label, 16, rowY)
    pdf.text((spot.application?.exposant_data?.business_name || spot.application?.profiles?.full_name || '').substring(0, 35), 30, rowY)
    pdf.text((spot.application?.exposant_data?.category || '—').substring(0, 25), 90, rowY)
    pdf.text(`${spot.width_m}×${spot.length_m}m`, 150, rowY)
    pdf.text((spot.application?.profiles?.email || '').substring(0, 30), 180, rowY)
    pdf.text(spot.application?.profiles?.phone || '—', 240, rowY)
    rowY += 6
  })

  // Save
  const filename = `${eventTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-plan.pdf`
  pdf.save(filename)
}

// ========== EXPORT PNG ==========
export async function exportToPNG({ eventTitle, mapElement }: { eventTitle: string; mapElement: HTMLElement }) {
  const html2canvas = (await import('html2canvas')).default
  const canvas = await html2canvas(mapElement, {
    useCORS: true,
    allowTaint: true,
    scale: 3,
    backgroundColor: '#ffffff',
  })
  const link = document.createElement('a')
  link.download = `${eventTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-plan.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

// ========== EXPORT EXCEL ==========
export async function exportToExcel({ eventTitle, spots }: { eventTitle: string; spots: Spot[] }) {
  const XLSX = await import('xlsx')

  const data = spots
    .filter(s => s.type === 'emplacement')
    .sort((a, b) => a.label.localeCompare(b.label))
    .map(spot => ({
      'Case': spot.label,
      'Statut': spot.application_id ? 'Attribué' : 'Libre',
      'Exposant': spot.application?.exposant_data?.business_name || spot.application?.profiles?.full_name || '',
      'Activité': spot.application?.exposant_data?.category || '',
      'Stand (m)': `${spot.width_m} × ${spot.length_m}`,
      'Email': spot.application?.profiles?.email || '',
      'Téléphone': spot.application?.profiles?.phone || '',
      'SIREN': spot.application?.exposant_data?.siren || '',
      'Latitude': spot.lat.toFixed(6),
      'Longitude': spot.lng.toFixed(6),
    }))

  const ws = XLSX.utils.json_to_sheet(data)

  // Largeurs colonnes
  ws['!cols'] = [
    { wch: 8 },  // Case
    { wch: 10 }, // Statut
    { wch: 30 }, // Exposant
    { wch: 20 }, // Activité
    { wch: 12 }, // Stand
    { wch: 30 }, // Email
    { wch: 16 }, // Tél
    { wch: 12 }, // SIREN
    { wch: 12 }, // Lat
    { wch: 12 }, // Lng
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Attributions')

  const filename = `${eventTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-attributions.xlsx`
  XLSX.writeFile(wb, filename)
}

// Helper
function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}