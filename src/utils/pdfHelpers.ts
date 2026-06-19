import { jsPDF } from 'jspdf';

type Doc = jsPDF;

const M = 14;
const PRIMARY: [number, number, number] = [25, 55, 170];
const DARK: [number, number, number] = [30, 35, 50];
const GRAY: [number, number, number] = [120, 125, 140];

export const pw = (doc: Doc): number => doc.internal.pageSize.getWidth();
export const ph = (doc: Doc): number => doc.internal.pageSize.getHeight();

/** Double-line professional page frame */
export const drawFrame = (doc: Doc) => {
  const w = pw(doc);
  const h = ph(doc);
  doc.setLineWidth(0.6);
  doc.setDrawColor(200, 200, 208);
  doc.rect(M, M, w - 2 * M, h - 2 * M);
  doc.setLineWidth(0.2);
  doc.setDrawColor(218, 218, 225);
  doc.rect(M + 2, M + 2, w - 2 * M - 4, h - 2 * M - 4);
};

/** Branded header block — returns next y position */
export const docHeader = (doc: Doc, title: string, subtitle: string, generatedBy: string): number => {
  const w = pw(doc);
  let y = M + 7;

  doc.setFillColor(...PRIMARY);
  doc.rect(M + 5, y, w - 2 * M - 10, 2.2, 'F');
  y += 5.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...PRIMARY);
  doc.text('FLEETCOMMAND OPERATIONS', M + 8, y);
  y += 5;

  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text(title, M + 8, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text(subtitle, M + 8, y);
  y += 3;

  doc.setFontSize(6);
  doc.text(`Generated: ${new Date().toLocaleString()}  |  By: ${generatedBy}  |  FleetCommand System v2.3`, M + 8, y);
  y += 2.5;

  doc.setDrawColor(208, 208, 215);
  doc.setLineWidth(0.3);
  doc.line(M + 8, y, w - M - 8, y);

  return y + 4;
};

/** Footer with page numbers on every page */
export const docFooter = (doc: Doc) => {
  const w = pw(doc);
  const h = ph(doc);
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(200, 200, 208);
    doc.setLineWidth(0.3);
    doc.line(M + 5, h - M - 7, w - M - 5, h - M - 7);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(5.5);
    doc.setTextColor(140, 142, 152);
    doc.text(`Page ${i} of ${pages}  |  FleetCommand Operations  |  This is a computer-generated document`, w / 2, h - M - 3.5, { align: 'center' });
  }
};

/** KPI summary bar — returns next y */
export const kpiRow = (doc: Doc, items: { label: string; value: string }[], y: number): number => {
  const w = pw(doc);
  const n = items.length;
  const cellW = (w - 2 * M - 14) / n;
  const h = 10;
  const x0 = M + 8;

  for (let i = 0; i < n; i++) {
    const x = x0 + i * (cellW + 1.5);
    doc.setFillColor(i % 2 === 0 ? 248 : 252, i % 2 === 0 ? 248 : 252, i % 2 === 0 ? 252 : 252);
    doc.setDrawColor(215, 215, 222);
    doc.rect(x, y, cellW, h, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(...GRAY);
    doc.text(items[i].label, x + 1.5, y + 3.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...DARK);
    doc.text(items[i].value, x + 1.5, y + h - 2);
  }

  return y + h + 3;
};

/** Table header row with blue background — returns next y */
export const tableHeader = (doc: Doc, cols: number[], headers: string[], y: number, fs = 6.5): number => {
  const w = pw(doc);
  const h = 5.5;

  for (let i = 0; i < headers.length; i++) {
    const x1 = cols[i];
    const x2 = i < headers.length - 1 ? cols[i + 1] : w - M - 8;
    doc.setFillColor(...PRIMARY);
    doc.rect(x1 - 0.5, y, x2 - x1 + 0.5, h, 'F');
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fs);
  doc.setTextColor(255, 255, 255);
  headers.forEach((hdr, i) => doc.text(hdr, cols[i] + 0.5, y + h - 1.3));

  return y + h;
};

/** Table data row with alternating background — returns next y */
export const tableRow = (doc: Doc, cols: number[], values: string[], y: number, altIdx: number, fs = 5.5): number => {
  const w = pw(doc);
  const h = 4.2;

  if (altIdx % 2 === 1) {
    doc.setFillColor(247, 247, 251);
    for (let i = 0; i < values.length; i++) {
      const x1 = cols[i];
      const x2 = i < values.length - 1 ? cols[i + 1] : w - M - 8;
      doc.rect(x1 - 0.5, y, x2 - x1 + 0.5, h, 'F');
    }
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fs);
  doc.setTextColor(55, 58, 68);
  values.forEach((val, i) => doc.text(val, cols[i] + 0.5, y + h - 1));

  return y + h;
};

/** Auto page break — returns adjusted y */
export const checkPage = (doc: Doc, y: number, margin = 16): number => {
  if (y > ph(doc) - margin) {
    doc.addPage();
    return M + 10;
  }
  return y;
};

/** Section title line */
export const sectionTitle = (doc: Doc, text: string, y: number): number => {
  const w = pw(doc);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...DARK);
  doc.text(text, M + 8, y);
  const tw = doc.getTextWidth(text);
  y += 1.5;
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.4);
  doc.line(M + 8, y, M + 8 + tw + 4, y);
  return y + 3.5;
};
