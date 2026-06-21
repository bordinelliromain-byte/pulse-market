// src/lib/terrainExports.ts
// ═════════════════════════════════════════════════════════════
// PULSEMARKET — Exports PDF / PNG / Excel des plans d'attribution
// ✅ Migré de xlsx → exceljs (sans vulnérabilités)
// ═════════════════════════════════════════════════════════════

import type { Spot, Exposant } from '@/components/TerrainEditor'
import { getCategoryColor, CATEGORY_COLORS } from '@/components/TerrainEditor'

interface ExportOptions {
  eventTitle: string
  spots: Spot[]
  exposants: Exposant[]
  mapElement: HTMLElement
}

// ═════════════════════════════════════════════════════════════
// EXPORT PDF (inchangé — utilise jspdf + html2canvas)
// ═════════════════════════════════════════════════════════════
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
  pdf.addPage('a4', 'landscape')

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
      pdf.addPage('a4', 'landscape')
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

// ═════════════════════════════════════════════════════════════
// EXPORT PNG (inchangé — utilise html2canvas)
// ═════════════════════════════════════════════════════════════
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

// ═════════════════════════════════════════════════════════════
// EXPORT EXCEL — Migré vers exceljs (sans vulnérabilités)
// ═════════════════════════════════════════════════════════════
export async function exportToExcel({ eventTitle, spots }: { eventTitle: string; spots: Spot[] }) {
  // ✅ Import dynamique d'exceljs
  const ExcelJS = (await import('exceljs')).default

  // Créer le workbook
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'PulseMarket'
  workbook.created = new Date()
  workbook.modified = new Date()

  // Créer la worksheet
  const worksheet = workbook.addWorksheet('Attributions', {
    properties: { tabColor: { argb: 'FF4F46E5' } },
  })

  // ─── Définir les colonnes avec headers + largeurs ───
  worksheet.columns = [
    { header: 'Case', key: 'case', width: 8 },
    { header: 'Statut', key: 'statut', width: 12 },
    { header: 'Exposant', key: 'exposant', width: 30 },
    { header: 'Activité', key: 'activite', width: 22 },
    { header: 'Stand (m)', key: 'stand', width: 12 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Téléphone', key: 'telephone', width: 16 },
    { header: 'SIREN', key: 'siren', width: 14 },
    { header: 'Latitude', key: 'latitude', width: 12 },
    { header: 'Longitude', key: 'longitude', width: 12 },
  ]

  // ─── Style header ───
  const headerRow = worksheet.getRow(1)
  headerRow.font = {
    name: 'Calibri',
    size: 11,
    bold: true,
    color: { argb: 'FFFFFFFF' },
  }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F46E5' }, // BRAND PulseMarket
  }
  headerRow.alignment = { vertical: 'middle', horizontal: 'left' }
  headerRow.height = 22

  // Bordure header
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    }
  })

  // ─── Préparer les données ───
  const data = spots
    .filter(s => s.type === 'emplacement')
    .sort((a, b) => a.label.localeCompare(b.label))
    .map(spot => ({
      case: spot.label,
      statut: spot.application_id ? 'Attribué' : 'Libre',
      exposant: spot.application?.exposant_data?.business_name
        || spot.application?.profiles?.full_name
        || '',
      activite: spot.application?.exposant_data?.category || '',
      stand: `${spot.width_m} × ${spot.length_m}`,
      email: spot.application?.profiles?.email || '',
      telephone: spot.application?.profiles?.phone || '',
      siren: spot.application?.exposant_data?.siren || '',
      latitude: spot.lat.toFixed(6),
      longitude: spot.lng.toFixed(6),
    }))

  // ─── Ajouter les lignes ───
  worksheet.addRows(data)

  // ─── Styliser les lignes de données ───
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return // Skip header

    // Alternance couleurs (zébré)
    if (rowNumber % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8FAFC' }, // Gris très clair
      }
    }

    // Style général des cellules
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Calibri', size: 10 }
      cell.alignment = { vertical: 'middle', horizontal: 'left' }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFF1F5F9' } },
        left: { style: 'thin', color: { argb: 'FFF1F5F9' } },
        bottom: { style: 'thin', color: { argb: 'FFF1F5F9' } },
        right: { style: 'thin', color: { argb: 'FFF1F5F9' } },
      }

      // ✅ Colorer la colonne "Statut" selon valeur
      if (colNumber === 2) {
        const isAttribue = cell.value === 'Attribué'
        cell.font = {
          name: 'Calibri',
          size: 10,
          bold: true,
          color: { argb: isAttribue ? 'FF16A34A' : 'FFF59E0B' },
        }
      }
    })
  })

  // ─── Freeze header (header reste visible au scroll) ───
  worksheet.views = [{ state: 'frozen', ySplit: 1 }]

  // ─── Générer le fichier et déclencher le download ───
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${eventTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-attributions.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

// ═════════════════════════════════════════════════════════════
// HELPER
// ═════════════════════════════════════════════════════════════
function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}