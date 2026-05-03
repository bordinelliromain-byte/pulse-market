// src/lib/generateBoostInvoice.ts
// Génère une facture PDF pour un paiement Boost My Business

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export async function generateBoostInvoice(data: {
  nom: string
  offre: string
  eventTitle: string
  email: string
  amount: number
  stripeSessionId: string
  date?: string
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([595, 842]) // A4
  const { width, height } = page.getSize()

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const fontReg = await doc.embedFont(StandardFonts.Helvetica)

  const INDIGO = rgb(0.31, 0.27, 0.9)
  const DARK = rgb(0.07, 0.09, 0.15)
  const GRAY = rgb(0.42, 0.45, 0.51)
  const LIGHT = rgb(0.97, 0.97, 0.97)
  const WHITE = rgb(1, 1, 1)

  const invoiceDate = data.date || new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const invoiceNumber = `WM-${Date.now().toString().slice(-8)}`

  // ── HEADER BAND ──────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: height - 120, width, height: 120, color: DARK })

  page.drawText('whatmarket', { x: 40, y: height - 55, size: 28, font: fontBold, color: WHITE })
  page.drawText('Plateforme des marchés locaux', { x: 40, y: height - 75, size: 11, font: fontReg, color: rgb(0.6, 0.6, 0.65) })

  page.drawText('FACTURE', { x: width - 160, y: height - 50, size: 22, font: fontBold, color: WHITE })
  page.drawText(invoiceNumber, { x: width - 160, y: height - 70, size: 11, font: fontReg, color: rgb(0.6, 0.6, 0.65) })
  page.drawText(invoiceDate, { x: width - 160, y: height - 88, size: 10, font: fontReg, color: rgb(0.6, 0.6, 0.65) })

  // ── INFOS CLIENT ─────────────────────────────────────────────────────────
  page.drawText('Facturé à', { x: 40, y: height - 155, size: 10, font: fontBold, color: GRAY })
  page.drawText(data.nom, { x: 40, y: height - 172, size: 13, font: fontBold, color: DARK })
  page.drawText(data.email, { x: 40, y: height - 188, size: 11, font: fontReg, color: GRAY })

  // ── DÉTAIL PRESTATION ────────────────────────────────────────────────────
  const tableY = height - 280

  // Header table
  page.drawRectangle({ x: 40, y: tableY - 4, width: width - 80, height: 32, color: INDIGO })
  page.drawText('Description', { x: 52, y: tableY + 8, size: 10, font: fontBold, color: WHITE })
  page.drawText('Marché', { x: 280, y: tableY + 8, size: 10, font: fontBold, color: WHITE })
  page.drawText('Montant', { x: width - 115, y: tableY + 8, size: 10, font: fontBold, color: WHITE })

  // Ligne 1
  page.drawRectangle({ x: 40, y: tableY - 44, width: width - 80, height: 36, color: LIGHT })
  page.drawText('Publication sponsorisée', { x: 52, y: tableY - 26, size: 11, font: fontBold, color: DARK })
  page.drawText(data.offre, { x: 52, y: tableY - 40, size: 9, font: fontReg, color: GRAY })
  page.drawText(data.eventTitle.length > 20 ? data.eventTitle.slice(0, 20) + '...' : data.eventTitle, { x: 280, y: tableY - 30, size: 10, font: fontReg, color: DARK })
  page.drawText(`${data.amount.toFixed(2)} €`, { x: width - 115, y: tableY - 30, size: 11, font: fontBold, color: DARK })

  // ── TOTAL ────────────────────────────────────────────────────────────────
  const totalY = tableY - 100

  page.drawLine({ start: { x: width - 200, y: totalY + 36 }, end: { x: width - 40, y: totalY + 36 }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) })

  page.drawText('Sous-total HT', { x: width - 200, y: totalY + 18, size: 10, font: fontReg, color: GRAY })
  page.drawText(`${(data.amount / 1.2).toFixed(2)} €`, { x: width - 115, y: totalY + 18, size: 10, font: fontReg, color: DARK })

  page.drawText('TVA (20%)', { x: width - 200, y: totalY, size: 10, font: fontReg, color: GRAY })
  page.drawText(`${(data.amount - data.amount / 1.2).toFixed(2)} €`, { x: width - 115, y: totalY, size: 10, font: fontReg, color: DARK })

  page.drawRectangle({ x: width - 210, y: totalY - 32, width: 170, height: 28, color: INDIGO })
  page.drawText('TOTAL TTC', { x: width - 200, y: totalY - 20, size: 11, font: fontBold, color: WHITE })
  page.drawText(`${data.amount.toFixed(2)} €`, { x: width - 115, y: totalY - 20, size: 13, font: fontBold, color: WHITE })

  // ── RÉFÉRENCE PAIEMENT ───────────────────────────────────────────────────
  page.drawText('Référence paiement', { x: 40, y: totalY - 20, size: 9, font: fontBold, color: GRAY })
  page.drawText(data.stripeSessionId, { x: 40, y: totalY - 34, size: 8, font: fontReg, color: GRAY })
  page.drawText('Paiement reçu via Stripe · Merci pour votre confiance !', { x: 40, y: totalY - 50, size: 9, font: fontReg, color: GRAY })

  // ── FOOTER ───────────────────────────────────────────────────────────────
  page.drawLine({ start: { x: 40, y: 60 }, end: { x: width - 40, y: 60 }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) })
  page.drawText('whatmarket.fr · contact@whatmarket.fr', { x: 40, y: 42, size: 9, font: fontReg, color: GRAY })
  page.drawText('Publication Boost My Business · Service numérique', { x: 40, y: 28, size: 9, font: fontReg, color: GRAY })

  return doc.save()
}