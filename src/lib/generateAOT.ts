// src/lib/generateAOT.ts
import jsPDF from 'jspdf'
import QRCode from 'qrcode'

type AOTData = {
  candidatureId: string
  exposantNom: string
  exposantSiren?: string
  exposantBusinessName?: string
  exposantProduits?: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  caseNumber?: string
  mairieNom: string
  paidAt: string
}

export async function generateAOT(data: AOTData): Promise<Blob> {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 18

  // Header sombre
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, pageWidth, 40, 'F')

  // Logo placeholder
  doc.setFillColor(79, 70, 229)
  doc.roundedRect(margin, 12, 16, 16, 3, 3, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('PM', margin + 8, 22, { align: 'center' })

  // Titre
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('AUTORISATION D\'OCCUPATION', margin + 22, 18)
  doc.setFontSize(16)
  doc.text('TEMPORAIRE DU DOMAINE PUBLIC', margin + 22, 25)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text(`N° AOT-${data.candidatureId.substring(0, 8).toUpperCase()}`, margin + 22, 32)

  // Reset color
  doc.setTextColor(15, 23, 42)

  let y = 55

  // Mairie
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('DÉLIVRÉE PAR', margin, y)
  y += 5
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(data.mairieNom, margin, y)

  y += 14

  // Section : Bénéficiaire
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(margin, y, pageWidth - margin * 2, 32, 2, 2, 'F')

  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text('BÉNÉFICIAIRE', margin + 5, y + 7)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text(data.exposantBusinessName || data.exposantNom, margin + 5, y + 15)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  if (data.exposantSiren) {
    doc.text(`SIREN : ${data.exposantSiren}`, margin + 5, y + 22)
  }
  if (data.exposantProduits) {
    doc.text(`Activité : ${data.exposantProduits}`, margin + 5, y + 28)
  }

  y += 42

  // Section : Détails du marché
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text('POUR LE MARCHÉ SUIVANT', margin, y)
  y += 7

  doc.setFillColor(238, 242, 255)
  doc.roundedRect(margin, y, pageWidth - margin * 2, 35, 2, 2, 'F')

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(79, 70, 229)
  doc.text(data.eventTitle, margin + 5, y + 8)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text(`Date : ${data.eventDate}`, margin + 5, y + 16)
  doc.text(`Lieu : ${data.eventLocation}`, margin + 5, y + 22)

  if (data.caseNumber) {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(79, 70, 229)
    doc.setFontSize(11)
    doc.text(`Emplacement : ${data.caseNumber}`, margin + 5, y + 30)
  }

  y += 45

  // Texte légal
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  const legalText = `Le bénéficiaire désigné ci-dessus est autorisé à occuper temporairement le domaine public dans le cadre du marché mentionné, conformément au règlement municipal et au Code Général de la Propriété des Personnes Publiques (articles L.2122-1 et suivants). Cette autorisation est strictement personnelle, non cessible, et limitée à la date et au lieu indiqués.`
  const splitLegal = doc.splitTextToSize(legalText, pageWidth - margin * 2)
  doc.text(splitLegal, margin, y)
  y += splitLegal.length * 4 + 6

  // QR Code
  const verifUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://pulse-market.fr'}/verif/${data.candidatureId}`
  const qrDataUrl = await QRCode.toDataURL(verifUrl, {
    width: 240,
    margin: 0,
    color: { dark: '#0F172A', light: '#FFFFFF' }
  })

  // Section QR + vérif
  const qrY = y + 5
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(margin, qrY, pageWidth - margin * 2, 50, 2, 2, 'FD')

  doc.addImage(qrDataUrl, 'PNG', margin + 5, qrY + 5, 40, 40)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text('Vérification placier', margin + 50, qrY + 10)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text('Scannez ce QR code avec votre téléphone pour', margin + 50, qrY + 17)
  doc.text('vérifier instantanément la validité de cette', margin + 50, qrY + 22)
  doc.text('autorisation.', margin + 50, qrY + 27)

  doc.setFontSize(7)
  doc.setTextColor(100, 116, 139)
  doc.text(`Code unique : ${data.candidatureId}`, margin + 50, qrY + 36)
  doc.text(`Payé le : ${data.paidAt}`, margin + 50, qrY + 42)

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 18
  doc.setDrawColor(226, 232, 240)
  doc.line(margin, footerY, pageWidth - margin, footerY)
  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)
  doc.text('Document généré automatiquement par PulseMarket', margin, footerY + 6)
  doc.text('pulse-market.fr', pageWidth - margin, footerY + 6, { align: 'right' })

  return doc.output('blob')
}

export async function downloadAOT(data: AOTData) {
  const blob = await generateAOT(data)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `AOT-${data.candidatureId.substring(0, 8)}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function openAOT(data: AOTData) {
  const blob = await generateAOT(data)
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}