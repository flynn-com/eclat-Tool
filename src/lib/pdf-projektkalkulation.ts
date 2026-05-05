import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PdfKalkData {
  projektname: string;
  kunde: string;
  datum: string;
  erstelltVon: string;
  positionen: { bezeichnung: string; stunden: number }[];
  equipment: { name: string; tagessatz: number; tage: number; gesamt: number }[];
  stundenGesamt: number;
  stundenSatz: number;
  stundenKosten: number;
  steuerProzent: number;
  steuerBetrag: number;
  investProzent: number;
  investBetrag: number;
  equipmentKosten: number;
  gesamtKosten: number;
}

// Brand colours
const B = { r: 0, g: 25, b: 46 };
const ACCENT = { r: 16, g: 185, b: 129 }; // green
const WARN = { r: 245, g: 158, b: 11 };   // amber
const GRAY = { r: 120, g: 130, b: 140 };
const LIGHT_BG: [number, number, number] = [239, 242, 249];

function eur(v: number): string {
  return v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}
function n2(v: number): string {
  return v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export async function generateProjektkalkulationPdf(data: PdfKalkData): Promise<jsPDF> {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const ml = 18;
  const mr = pw - 18;

  // --- HEADER ---
  try {
    const resp = await fetch('/logo.png');
    const blob = await resp.blob();
    const b64 = await new Promise<string>((res) => {
      const r = new FileReader();
      r.onloadend = () => res(r.result as string);
      r.readAsDataURL(blob);
    });
    doc.addImage(b64, 'PNG', ml, 10, 36, 16);
  } catch {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(B.r, B.g, B.b);
    doc.text('éclat.', ml, 22);
  }

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(B.r, B.g, B.b);
  doc.text('Projektkalkulation', mr, 18, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
  doc.text(data.datum, mr, 24, { align: 'right' });

  // Header line
  doc.setDrawColor(B.r, B.g, B.b);
  doc.setLineWidth(0.4);
  doc.line(ml, 31, mr, 31);

  doc.setFontSize(7);
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
  doc.setFont('helvetica', 'normal');
  doc.text(`Erstellt von ${data.erstelltVon}  •  ${data.datum}`, ml, 37);

  let y = 45;

  // --- PROJECT INFO ---
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(ml - 2, y - 4, mr - ml + 4, 7, 1, 1, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(B.r, B.g, B.b);
  doc.text('Projektinformationen', ml, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Projekt:', ml + 2, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(B.r, B.g, B.b);
  doc.text(data.projektname || '—', ml + 30, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Kunde:', ml + 2, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(B.r, B.g, B.b);
  doc.text(data.kunde || '—', ml + 30, y);
  y += 10;

  // --- POSITIONEN TABLE ---
  if (data.positionen.length > 0) {
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(ml - 2, y - 4, mr - ml + 4, 7, 1, 1, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(B.r, B.g, B.b);
    doc.text('Leistungspositionen', ml, y);
    y += 5;

    const posBody = data.positionen.map((p) => [p.bezeichnung, `${n2(p.stunden)} Std`]);
    // Total row
    posBody.push(['Gesamt', `${n2(data.stundenGesamt)} Std`]);

    autoTable(doc, {
      startY: y,
      head: [['Bezeichnung', 'Stunden']],
      body: posBody,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        textColor: [60, 60, 60],
        lineColor: [200, 210, 220],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [B.r, B.g, B.b],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        lineColor: [B.r, B.g, B.b],
      },
      alternateRowStyles: { fillColor: LIGHT_BG },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { halign: 'right', cellWidth: 35 },
      },
      didParseCell: (hookData) => {
        if (hookData.row.index === posBody.length - 1) {
          hookData.cell.styles.fontStyle = 'bold';
          hookData.cell.styles.textColor = [ACCENT.r, ACCENT.g, ACCENT.b];
        }
      },
      margin: { left: ml },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // --- EQUIPMENT TABLE ---
  if (data.equipment.length > 0) {
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(ml - 2, y - 4, mr - ml + 4, 7, 1, 1, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(B.r, B.g, B.b);
    doc.text('Equipment', ml, y);
    y += 5;

    const eqBody = data.equipment.map((e) => [
      e.name,
      eur(e.tagessatz),
      String(e.tage),
      eur(e.gesamt),
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Name', 'Tagessatz', 'Tage', 'Gesamt']],
      body: eqBody,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        textColor: [60, 60, 60],
        lineColor: [200, 210, 220],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [B.r, B.g, B.b],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        lineColor: [B.r, B.g, B.b],
      },
      alternateRowStyles: { fillColor: LIGHT_BG },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { halign: 'right', cellWidth: 32 },
        2: { halign: 'right', cellWidth: 18 },
        3: { halign: 'right', cellWidth: 32 },
      },
      margin: { left: ml },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // --- KALKULATION SUMMARY ---
  // Check if we need a new page
  if (y > ph - 80) {
    doc.addPage();
    y = 20;
  }

  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(ml - 2, y - 4, mr - ml + 4, 7, 1, 1, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(B.r, B.g, B.b);
  doc.text('Kalkulation', ml, y);
  y += 8;

  const summaryRows: { label: string; detail: string; value: string; bold?: boolean; color?: typeof ACCENT }[] = [
    {
      label: 'Stundenkosten',
      detail: `${n2(data.stundenGesamt)} Std × ${data.stundenSatz} €/Std`,
      value: eur(data.stundenKosten),
    },
    {
      label: `Steuerrücklage (${data.steuerProzent}%)`,
      detail: '',
      value: eur(data.steuerBetrag),
    },
    {
      label: `Investrücklage (${data.investProzent}%)`,
      detail: '',
      value: eur(data.investBetrag),
    },
    {
      label: 'Equipment',
      detail: '',
      value: eur(data.equipmentKosten),
    },
  ];

  for (const row of summaryRows) {
    doc.setFillColor(...LIGHT_BG);
    doc.rect(ml, y - 4, mr - ml, 8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(row.label, ml + 2, y);
    if (row.detail) {
      doc.setFontSize(7);
      doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
      doc.text(row.detail, ml + 55, y);
    }
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(row.value, mr - 2, y, { align: 'right' });
    y += 9;
  }

  // Divider
  doc.setDrawColor(B.r, B.g, B.b);
  doc.setLineWidth(0.5);
  doc.line(ml, y - 2, mr, y - 2);
  y += 3;

  // Gesamt row
  doc.setFillColor(B.r, B.g, B.b);
  doc.rect(ml, y - 4, mr - ml, 10, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Gesamtkosten (netto)', ml + 2, y + 1);
  doc.setTextColor(ACCENT.r, ACCENT.g, ACCENT.b);
  doc.text(eur(data.gesamtKosten), mr - 2, y + 1, { align: 'right' });
  y += 14;

  // Hinweis
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(WARN.r, WARN.g, WARN.b);
  doc.text('Alle Preise zzgl. gesetzlicher Mehrwertsteuer. Diese Kalkulation ist unverbindlich.', ml, y);

  // --- FOOTER ---
  doc.setDrawColor(B.r, B.g, B.b);
  doc.setLineWidth(0.3);
  doc.line(ml, ph - 18, mr, ph - 18);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(B.r, B.g, B.b);
  doc.text('éclat studios GbR', pw / 2, ph - 13, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
  doc.text('Allemeier  •  Hasenzahl  •  Bertsch', pw / 2, ph - 9.5, { align: 'center' });
  doc.setFontSize(5);
  doc.text(`Erstellt am ${data.datum} von ${data.erstelltVon}`, pw / 2, ph - 6.5, { align: 'center' });

  return doc;
}
