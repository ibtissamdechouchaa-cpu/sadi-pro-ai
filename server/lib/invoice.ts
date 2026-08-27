import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface InvoiceData {
  id: string;
  date: string;
  amount: string;
  amountValue: number;
  planName: string;
  status: string;
  organizationName: string;
  organizationEmail: string;
  billingCycle: string;
}

export async function generateInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]); // A4
  const { width, height } = page.getSize();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const primary = rgb(0.15, 0.39, 0.92); // primary-600
  const gray = rgb(0.42, 0.45, 0.5);
  const lightGray = rgb(0.9, 0.9, 0.9);

  // Header bar
  page.drawRectangle({ x: 0, y: height - 70, width, height: 70, color: primary });
  page.drawText("SADI PRO", { x: 40, y: height - 35, size: 18, font: fontBold, color: rgb(1,1,1) });
  page.drawText("Smart Archive  •  AI Document Intelligence", { x: 40, y: height - 52, size: 8, font, color: rgb(1,1,1) });
  page.drawText("FACTURE / INVOICE", { x: width - 140, y: height - 35, size: 12, font: fontBold, color: rgb(1,1,1) });
  page.drawText(data.id, { x: width - 140, y: height - 52, size: 8, font, color: rgb(1,1,1) });

  // Company info (Algerian)
  let y = height - 100;
  page.drawText("SADI PRO SARL", { x: 40, y, size: 10, font: fontBold, color: rgb(0.15,0.15,0.15) });
  y -= 14; page.drawText("Cité 1200 Logements, Bat E2, Algiers 16000, Algeria", { x: 40, y, size: 8, font, color: gray });
  y -= 12; page.drawText("NIF: 123456789012345  •  NIS: 12345678  •  RC: 16/00-1234567 B16", { x: 40, y, size: 7, font, color: gray });
  y -= 12; page.drawText("Email: contact@sadi.pro  •  Tel: +213 21 123456", { x: 40, y, size: 7, font, color: gray });

  // Bill To
  y -= 30;
  page.drawText("Facturé à / Bill To:", { x: 40, y, size: 9, font: fontBold, color: rgb(0.15,0.15,0.15) });
  y -= 14; page.drawText(data.organizationName || "Organization", { x: 40, y, size: 9, font, color: rgb(0.15,0.15,0.15) });
  y -= 12; page.drawText(data.organizationEmail || "", { x: 40, y, size: 8, font, color: gray });

  // Invoice meta box
  const boxX = width - 220;
  let boxY = height - 130;
  page.drawRectangle({ x: boxX, y: boxY - 50, width: 180, height: 60, borderColor: lightGray, borderWidth: 1 });
  page.drawText(`Date: ${data.date}`, { x: boxX + 10, y: boxY - 12, size: 8, font, color: gray });
  page.drawText(`Échéance: ${data.date}`, { x: boxX + 10, y: boxY - 26, size: 8, font, color: gray });
  page.drawText(`Statut: ${data.status}`, { x: boxX + 10, y: boxY - 40, size: 8, font: fontBold, color: data.status === "Paid" ? rgb(0.1,0.6,0.2) : rgb(0.8,0.3,0.1) });

  // Table header
  y -= 30;
  const tableY = y;
  page.drawRectangle({ x: 40, y: tableY - 20, width: width - 80, height: 20, color: rgb(0.96,0.96,0.96) });
  page.drawText("Description", { x: 50, y: tableY - 14, size: 8, font: fontBold, color: gray });
  page.drawText("Période", { x: 320, y: tableY - 14, size: 8, font: fontBold, color: gray });
  page.drawText("Montant HT", { x: 430, y: tableY - 14, size: 8, font: fontBold, color: gray });

  // Table row - Plan
  y = tableY - 40;
  page.drawText(`Plan ${data.planName} — ${data.billingCycle === 'annual' ? 'Annuel' : 'Mensuel'}`, { x: 50, y, size: 9, font, color: rgb(0.15,0.15,0.15) });
  page.drawText(data.billingCycle === 'annual' ? '1 an' : '1 mois', { x: 320, y, size: 8, font, color: gray });
  page.drawText(`${data.amount}`, { x: 430, y, size: 9, font: fontBold, color: rgb(0.15,0.15,0.15) });

  // Separator
  y -= 12;
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: lightGray });

  // Totals
  y -= 20;
  // Calculate TVA 19% for Algerian
  const tva = Math.round(data.amountValue * 0.19);
  const ttc = data.amountValue + tva;
  page.drawText("Sous-total HT:", { x: 380, y, size: 8, font, color: gray });
  page.drawText(`${new Intl.NumberFormat('fr-DZ').format(data.amountValue)} DZD`, { x: 470, y, size: 8, font, color: rgb(0.15,0.15,0.15) });
  y -= 14;
  page.drawText("TVA 19%:", { x: 380, y, size: 8, font, color: gray });
  page.drawText(`${new Intl.NumberFormat('fr-DZ').format(tva)} DZD`, { x: 470, y, size: 8, font, color: rgb(0.15,0.15,0.15) });
  y -= 14;
  page.drawRectangle({ x: 370, y: y - 6, width: 185, height: 18, color: primary });
  page.drawText("Total TTC:", { x: 380, y, size: 9, font: fontBold, color: rgb(1,1,1) });
  page.drawText(`${new Intl.NumberFormat('fr-DZ').format(ttc)} DZD`, { x: 470, y, size: 9, font: fontBold, color: rgb(1,1,1) });

  // Payment info - Algerian gateway
  y -= 40;
  page.drawText("Paiement via gateway algérien:", { x: 40, y, size: 8, font: fontBold, color: rgb(0.15,0.15,0.15) });
  y -= 12; page.drawText("• CIB  •  Edahabia (Algerie Poste)  •  BaridiMob  •  Virement bancaire", { x: 40, y, size: 7, font, color: gray });
  y -= 10; page.drawText("Chargily Pay / SATIM — Paiement sécurisé en DZD", { x: 40, y, size: 7, font, color: gray });
  y -= 10; page.drawText("Référence de paiement: " + data.id.replace('INV','PAY'), { x: 40, y, size: 7, font, color: gray });

  // Footer
  const footerY = 40;
  page.drawLine({ start: { x: 40, y: footerY + 20 }, end: { x: width - 40, y: footerY + 20 }, thickness: 0.5, color: lightGray });
  page.drawText("Merci pour votre confiance. Document généré automatiquement par SADI PRO.", { x: 40, y: footerY + 8, size: 7, font, color: gray });
  page.drawText("SADI PRO — Smart Archive • contact@sadi.pro • www.sadi.pro", { x: 40, y: footerY - 2, size: 7, font, color: gray });
  page.drawText("Page 1/1", { x: width - 80, y: footerY - 2, size: 7, font, color: gray });

  return await pdf.save();
}
