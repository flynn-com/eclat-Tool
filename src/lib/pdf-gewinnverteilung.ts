import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PdfPosition {
  name: string;
  stunden: number;
  anteilGleich: number;
  anteilStunden: number;
  bonus: number;
  gesamt: number;
  stundenlohn: number;
}

interface PdfData {
  gesamtgewinn: number;
  gewinnNachBonus: number;
  gesamtBonus: number;
  steuerruecklage: number;
  verteilungProzent: { gleich: number; stunden: number; steuer: number };
  positionen: PdfPosition[];
  erstelltVon: string;
  datum: string;
}

function fmtEuro(v: number): string {
  return v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' \u20AC';
}

export function generateGewinnverteilungPdf(data: PdfData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Gewinnverteilung', pageWidth / 2, 25, { align: 'center' });

  // Meta info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Datum: ${data.datum}`, 14, 38);
  doc.text(`Erstellt von: ${data.erstelltVon}`, 14, 44);

  // Summary box
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Zusammenfassung', 14, 56);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const summaryData = [
    ['Gesamtgewinn', fmtEuro(data.gesamtgewinn)],
    ['Vertriebsbonus (abgezogen)', fmtEuro(data.gesamtBonus)],
    ['Gewinn nach Bonus', fmtEuro(data.gewinnNachBonus)],
    ['', ''],
    ['Verteilungsschluessel', ''],
    [`  Gleichmaessig`, `${data.verteilungProzent.gleich} %`],
    [`  Nach Stunden`, `${data.verteilungProzent.stunden} %`],
    [`  Steuerruecklage`, `${data.verteilungProzent.steuer} %`],
  ];

  autoTable(doc, {
    startY: 60,
    head: [],
    body: summaryData,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 60, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14 },
  });

  // Positions table
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Verteilung pro Person', 14, finalY);

  const tableHead = [['Person', 'Stunden', 'Gleich-Anteil', 'Stunden-Anteil', 'Bonus', 'Gesamt', 'Std-Lohn']];
  const tableBody = data.positionen.map((p) => [
    p.name,
    p.stunden.toFixed(1),
    fmtEuro(p.anteilGleich),
    fmtEuro(p.anteilStunden),
    p.bonus > 0 ? fmtEuro(p.bonus) : '-',
    fmtEuro(p.gesamt),
    fmtEuro(p.stundenlohn) + '/Std',
  ]);

  // Add totals row
  const totalGesamt = data.positionen.reduce((s, p) => s + p.gesamt, 0);
  const totalStunden = data.positionen.reduce((s, p) => s + p.stunden, 0);
  tableBody.push([
    'GESAMT',
    totalStunden.toFixed(1),
    '',
    '',
    '',
    fmtEuro(totalGesamt),
    '',
  ]);

  autoTable(doc, {
    startY: finalY + 4,
    head: tableHead,
    body: tableBody,
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { halign: 'right', cellWidth: 20 },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right', fontStyle: 'bold' },
      6: { halign: 'right' },
    },
    margin: { left: 14 },
  });

  // Steuerruecklage
  const finalY2 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Steuerruecklage (${data.verteilungProzent.steuer} %): ${fmtEuro(data.steuerruecklage)}`, 14, finalY2);

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150);
  doc.text(`Erstellt am ${data.datum} von ${data.erstelltVon} - Firmen-Tool`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

  return doc;
}
