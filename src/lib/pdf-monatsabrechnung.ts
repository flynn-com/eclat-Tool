import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { MonatsabrechnungSettings } from './settings';

interface PdfPosition {
  name: string;
  uebertragStunden: number;
  monatsStunden: number;
  gesamtStunden: number;
  zugeteilteStunden: number;
  abzurechnendeStunden: number;
  anteil: number;
  bonus: number;
  auszahlung: number;
}

interface PdfData {
  monat: string;
  einnahmePositionen?: { projekt: string; betrag: string }[];
  einnahmen: number;
  ausgaben: number;
  gesamtSumme: number;
  steuerruecklage: number;
  investruecklage: number;
  boniSumme: number;
  abrechnungsgrundlage: number;
  anteileTopf: number;
  stundenTopf: number;
  maxStunden: number;
  settings: MonatsabrechnungSettings;
  positionen: PdfPosition[];
  erstelltVon: string;
  datum: string;
}

// Brand
const B = { r: 0, g: 25, b: 46 };
const ACCENT = { r: 16, g: 185, b: 129 }; // green
const WARN = { r: 245, g: 158, b: 11 }; // amber
const GRAY = { r: 120, g: 130, b: 140 };
const LIGHT_BG: [number, number, number] = [239, 242, 249]; // #EFF2F9

function eur(v: number): string {
  return v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' \u20AC';
}
function n(v: number): string {
  return v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export async function generateMonatsabrechnungPdf(data: PdfData) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const ml = 18;
  const mr = pw - 18;
  const col2 = 105;
  const col3 = 145;

  // --- HEADER ---
  try {
    const resp = await fetch('/logo.png');
    const blob = await resp.blob();
    const b64 = await new Promise<string>((res) => { const r = new FileReader(); r.onloadend = () => res(r.result as string); r.readAsDataURL(blob); });
    doc.addImage(b64, 'PNG', ml, 10, 36, 16);
  } catch {
    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(B.r, B.g, B.b);
    doc.text('\u00E9clat.', ml, 22);
  }

  doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor(B.r, B.g, B.b);
  doc.text('Monatsabrechnung', mr, 18, { align: 'right' });
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
  doc.text(data.monat, mr, 24, { align: 'right' });

  // Header line
  doc.setDrawColor(B.r, B.g, B.b); doc.setLineWidth(0.4);
  doc.line(ml, 31, mr, 31);

  doc.setFontSize(7); doc.setTextColor(GRAY.r, GRAY.g, GRAY.b); doc.setFont('helvetica', 'normal');
  doc.text(`Erstellt von ${data.erstelltVon}  \u2022  ${data.datum}`, ml, 37);

  let y = 45;

  // --- HELPERS ---
  const section = (title: string) => {
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(ml - 2, y - 4, mr - ml + 4, 7, 1, 1, 'F');
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(B.r, B.g, B.b);
    doc.text(title, ml, y);
    y += 7;
  };
  const row = (label: string, val: string, opts?: { bold?: boolean; color?: { r: number; g: number; b: number }; col?: number }) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60);
    doc.text(label, ml + 2, y);
    doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal');
    if (opts?.color) doc.setTextColor(opts.color.r, opts.color.g, opts.color.b);
    doc.text(val, opts?.col ?? col2, y, { align: 'right' });
    y += 5;
  };

  // ==========================================
  // 1. STUNDENKONTEN
  // ==========================================
  section('Stundenkonten');

  // Header row
  doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
  doc.text('Person', ml + 2, y);
  doc.text('Uebertrag', 75, y, { align: 'right' });
  doc.text(`+ ${data.monat.split(' ')[0]}`, col2, y, { align: 'right' });
  doc.text('= Gesamt', col3, y, { align: 'right' });
  y += 5;

  for (const p of data.positionen) {
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60);
    doc.text(p.name, ml + 2, y);
    doc.text(n(p.uebertragStunden), 75, y, { align: 'right' });
    doc.setTextColor(ACCENT.r, ACCENT.g, ACCENT.b);
    doc.text(`+${n(p.monatsStunden)}`, col2, y, { align: 'right' });
    doc.setFont('helvetica', 'bold'); doc.setTextColor(B.r, B.g, B.b);
    doc.text(n(p.gesamtStunden), col3, y, { align: 'right' });
    y += 5;
  }

  y += 4;

  // ==========================================
  // 2. EINNAHMEN & AUSGABEN
  // ==========================================
  section('Einnahmen & Ausgaben');

  if (data.einnahmePositionen && data.einnahmePositionen.length > 0) {
    for (const ep of data.einnahmePositionen) {
      const betrag = parseFloat(ep.betrag.replace(/\./g, '').replace(',', '.')) || 0;
      if (betrag > 0) {
        row(ep.projekt || 'Auftrag', eur(betrag), { color: ACCENT });
      }
    }
  }
  if (data.ausgaben > 0) {
    row('Ausgaben (netto)', `-${eur(data.ausgaben)}`, { color: { r: 220, g: 50, b: 50 } });
  }

  // Divider
  doc.setDrawColor(B.r, B.g, B.b); doc.setLineWidth(0.3);
  doc.line(ml + 2, y - 1, col2, y - 1);
  y += 2;

  row('Gesamt zu verteilende Summe', eur(data.gesamtSumme), { bold: true, color: B });
  y += 4;

  // ==========================================
  // 3. ABZUEGE & ABRECHNUNGSGRUNDLAGE
  // ==========================================
  section('Abzuege & Abrechnungsgrundlage');

  row(`Steuerruecklage (${data.settings.steuerProzent}%)`, eur(data.steuerruecklage));
  row(`Investitionsruecklage (${data.settings.investProzent}%)`, eur(data.investruecklage));
  if (data.boniSumme > 0) {
    for (const p of data.positionen) {
      if (p.bonus > 0) row(`Bonus - ${p.name}`, eur(p.bonus));
    }
  } else {
    row('Boni', '0,00 \u20AC');
  }

  doc.setDrawColor(B.r, B.g, B.b); doc.setLineWidth(0.3);
  doc.line(ml + 2, y - 1, col2, y - 1);
  y += 2;

  row('Abrechnungsgrundlage', eur(data.abrechnungsgrundlage), { bold: true, color: B });
  y += 4;

  // ==========================================
  // 4. VERTEILUNG
  // ==========================================
  section('Verteilung');

  const anteilPP = data.positionen.length > 0 ? data.anteileTopf / data.positionen.length : 0;
  const stundenPP = data.positionen.length > 0 ? data.maxStunden / data.positionen.length : 0;

  row(`${data.settings.anteileProzent}% Gesellschafteranteil`, eur(data.anteileTopf));
  row('  davon pro Person', eur(anteilPP), { color: ACCENT });
  y += 2;
  row(`${data.settings.stundenProzent}% nach Stunden (${data.settings.stundenSatz} \u20AC/Std)`, eur(data.stundenTopf));
  row('  max. abrechenbare Stunden', n(data.maxStunden), { color: ACCENT });
  row('  Stunden pro Person', n(stundenPP));
  row('  Auszahlung p.P. nach Stunden', eur(stundenPP * data.settings.stundenSatz), { color: ACCENT });

  y += 6;

  // ==========================================
  // 5. AUSZAHLUNGSTABELLE
  // ==========================================
  const head = [['', 'Nach Anteilen', 'Nach Stunden', 'Boni', 'Gesamt', 'Uebrige Std']];
  const tbody = data.positionen.map((p) => {
    const uebrig = Math.max(p.gesamtStunden - p.abzurechnendeStunden, 0);
    return [
      p.name,
      eur(p.anteil),
      eur(p.abzurechnendeStunden * data.settings.stundenSatz),
      p.bonus > 0 ? eur(p.bonus) : '-',
      eur(p.auszahlung),
      n(uebrig),
    ];
  });

  const totalAuszahlung = data.positionen.reduce((s, p) => s + p.auszahlung, 0);

  autoTable(doc, {
    startY: y,
    head,
    body: tbody,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3, textColor: [60, 60, 60], lineColor: [200, 210, 220], lineWidth: 0.2 },
    headStyles: { fillColor: [B.r, B.g, B.b], textColor: [255, 255, 255], fontStyle: 'bold', lineColor: [B.r, B.g, B.b] },
    alternateRowStyles: { fillColor: LIGHT_BG },
    columnStyles: {
      0: { cellWidth: 30, fontStyle: 'bold' },
      1: { halign: 'right', cellWidth: 28 },
      2: { halign: 'right', cellWidth: 28 },
      3: { halign: 'right', cellWidth: 22 },
      4: { halign: 'right', fontStyle: 'bold', textColor: [ACCENT.r, ACCENT.g, ACCENT.b], cellWidth: 30 },
      5: { halign: 'right', cellWidth: 24, textColor: [GRAY.r, GRAY.g, GRAY.b] },
    },
    margin: { left: ml },
  });

  const tableEnd = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  // Summary row below table
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(ml, tableEnd + 2, mr - ml, 10, 2, 2, 'F');
  doc.setFontSize(9); doc.setFont('helvetica', 'bold');
  doc.setTextColor(B.r, B.g, B.b);
  doc.text('Gesamt-Auszahlung', ml + 4, tableEnd + 8);
  doc.setTextColor(ACCENT.r, ACCENT.g, ACCENT.b);
  doc.text(eur(totalAuszahlung), mr - 4, tableEnd + 8, { align: 'right' });

  // Investitionsruecklage note
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(WARN.r, WARN.g, WARN.b);
  doc.text(`Investitionsruecklage auf Konto: ${eur(data.investruecklage)}`, ml + 4, tableEnd + 16);

  const restStunden = data.stundenTopf - data.positionen.reduce((s, p) => s + p.abzurechnendeStunden * data.settings.stundenSatz, 0);
  if (restStunden > 1) {
    doc.setFontSize(9);
    doc.text(`Nicht ausgezahlter Rest: ${eur(restStunden)}`, ml + 4, tableEnd + 22);
  }

  // --- FOOTER ---
  doc.setDrawColor(B.r, B.g, B.b); doc.setLineWidth(0.3);
  doc.line(ml, ph - 18, mr, ph - 18);

  doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(B.r, B.g, B.b);
  doc.text('\u00E9clat studios GbR', pw / 2, ph - 13, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
  doc.text('Allemeier  \u2022  Hasenzahl  \u2022  Bertsch', pw / 2, ph - 9.5, { align: 'center' });
  doc.setFontSize(5);
  doc.text(`Erstellt am ${data.datum} von ${data.erstelltVon}`, pw / 2, ph - 6.5, { align: 'center' });

  return doc;
}
