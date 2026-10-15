import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import { cgstRatePercent, sgstRatePercent, INVOICE_SAC_CODE } from './gst.js';
import { formatDateRange } from './date.js';

const BRAND = '#982078';
const INK = '#221a20';
const MUTED = '#756c74';
const RULE = '#efdce8';

const MARGIN = 48;
const PAGE_WIDTH = 595.28 - MARGIN * 2;

const LOGO_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'kisar-logo.png');
const LOGO_SIZE = 64;
const LOGO_GAP = 16;

// Read once. A missing logo must never stop an invoice from being generated.
const logo = (() => {
  try {
    return fs.readFileSync(LOGO_PATH);
  } catch {
    return null;
  }
})();

// Supplier details come from the environment so the GSTIN/address can be set per deployment.
const supplier = () => ({
  name: process.env.INVOICE_SELLER_NAME || 'Karnataka Chapter of ISAR (KISAR)',
  gstin: process.env.INVOICE_SELLER_GSTIN || '',
  address: process.env.INVOICE_SELLER_ADDRESS || '',
  state: process.env.INVOICE_SELLER_STATE || 'Karnataka',
  email: 'info@kisar.org.in',
});

const money = (amount) => `INR ${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata',
});

function keyValue(doc, label, value, x, y, width) {
  doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(label, x, y, { width });
  doc.font('Helvetica-Bold').fontSize(10).fillColor(INK).text(value, x, doc.y, { width });
}

// Resolves with a Buffer holding the GST tax invoice for a paid, confirmed registration.
export function generateInvoicePdf({ registration }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: MARGIN, info: { Title: `Tax Invoice ${registration.invoice.number}` } });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const seller = supplier();
    const cgstRate = `${cgstRatePercent()}%`;
    const sgstRate = `${sgstRatePercent()}%`;

    // Header — logo in the top-left corner, the title and seller block beside it.
    if (logo) doc.image(logo, MARGIN, MARGIN, { fit: [LOGO_SIZE, LOGO_SIZE] });
    const headerX = logo ? MARGIN + LOGO_SIZE + LOGO_GAP : MARGIN;
    doc.font('Helvetica-Bold').fontSize(22).fillColor(BRAND).text('TAX INVOICE', headerX, MARGIN);
    doc.moveDown(0.2);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(INK).text(seller.name);
    doc.font('Helvetica').fontSize(9).fillColor(MUTED);
    if (seller.address) doc.text(seller.address, { width: PAGE_WIDTH * 0.6 - (headerX - MARGIN) });
    if (seller.gstin) doc.text(`GSTIN: ${seller.gstin}`);
    doc.text(seller.email);

    // Invoice meta (right-aligned block)
    const metaX = MARGIN + PAGE_WIDTH * 0.62;
    const metaWidth = PAGE_WIDTH * 0.38;
    keyValue(doc, 'Invoice No.', registration.invoice.number, metaX, MARGIN, metaWidth);
    keyValue(doc, 'Invoice date', formatDate(registration.invoice.issuedAt), metaX, doc.y + 6, metaWidth);
    keyValue(doc, 'Order ID', registration.payment?.orderId ?? '-', metaX, doc.y + 6, metaWidth);

    doc.y = Math.max(doc.y, 170);
    doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + PAGE_WIDTH, doc.y).strokeColor(RULE).stroke();

    // Billed to
    const billedY = doc.y + 14;
    doc.font('Helvetica-Bold').fontSize(9).fillColor(BRAND).text('BILLED TO', MARGIN, billedY);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(INK).text(registration.name, MARGIN, doc.y + 2);
    doc.font('Helvetica').fontSize(9).fillColor(MUTED);
    doc.text(registration.email);
    if (registration.phone) doc.text(registration.phone);
    if (registration.isarMemberId) doc.text(`ISAR Member ID: ${registration.isarMemberId}`);
    doc.text(`Place of supply: ${seller.state}`);

    // Line item table
    const columns = [
      { label: 'Description', x: MARGIN, width: PAGE_WIDTH * 0.46, align: 'left' },
      { label: 'SAC', x: MARGIN + PAGE_WIDTH * 0.46, width: PAGE_WIDTH * 0.14, align: 'left' },
      { label: 'Amount', x: MARGIN + PAGE_WIDTH * 0.6, width: PAGE_WIDTH * 0.4, align: 'right' },
    ];

    const tableTop = doc.y + 24;
    doc.rect(MARGIN, tableTop, PAGE_WIDTH, 22).fill(BRAND);
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff');
    columns.forEach((c) => doc.text(c.label, c.x + 8, tableTop + 7, { width: c.width - 16, align: c.align }));

    const rowY = tableTop + 34;
    doc.font('Helvetica').fontSize(10).fillColor(INK);
    doc.text(`Event registration: ${registration.eventTitle}`, columns[0].x + 8, rowY, { width: columns[0].width - 16 });
    const descriptionBottom = doc.y;
    doc.text(INVOICE_SAC_CODE, columns[1].x + 8, rowY, { width: columns[1].width - 16 });
    doc.text(money(registration.baseAmount), columns[2].x + 8, rowY, { width: columns[2].width - 16, align: 'right' });

    doc.font('Helvetica').fontSize(9).fillColor(MUTED)
      .text(`Event date: ${formatDateRange(registration.eventDate, registration.eventEndDate)}`, columns[0].x + 8, descriptionBottom + 2, { width: columns[0].width - 16 });

    // Totals
    const totalsX = MARGIN + PAGE_WIDTH * 0.5;
    const totalsWidth = PAGE_WIDTH * 0.5;
    let y = doc.y + 18;
    doc.moveTo(MARGIN, y - 8).lineTo(MARGIN + PAGE_WIDTH, y - 8).strokeColor(RULE).stroke();

    const totalRow = (label, value, { bold = false } = {}) => {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 12 : 10).fillColor(bold ? BRAND : INK);
      doc.text(label, totalsX, y, { width: totalsWidth * 0.55 });
      doc.text(value, totalsX + totalsWidth * 0.55, y, { width: totalsWidth * 0.45 - 8, align: 'right' });
      y += bold ? 24 : 18;
    };

    totalRow('Taxable value', money(registration.baseAmount));
    totalRow(`CGST @ ${cgstRate}`, money(registration.cgst));
    totalRow(`SGST @ ${sgstRate}`, money(registration.sgst));
    doc.moveTo(totalsX, y - 4).lineTo(MARGIN + PAGE_WIDTH, y - 4).strokeColor(BRAND).stroke();
    y += 4;
    totalRow('Total paid', money(registration.amount), { bold: true });

    // Footer
    doc.font('Helvetica').fontSize(8).fillColor(MUTED).text(
      'This is a computer-generated invoice and does not require a signature. Payment received online via Cashfree.',
      MARGIN, y + 30, { width: PAGE_WIDTH },
    );

    doc.end();
  });
}
