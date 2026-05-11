import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CAMPAIGN_TYPE_LABELS, TEAM_ROLE_LABELS } from '@/lib/constants';

export interface AbschlussTeamMember {
  name: string;
  role: string;
  extern: boolean;
}

export interface AbschlussZeitUser {
  name: string;
  stunden: number;
}

export interface AbschlussEquipment {
  name: string;
  kategorie: string;
  tage: number;
  tagessatz: number;
  gesamt: number;
}

export interface PdfAbschlussData {
  // Projekt-Eckdaten
  projektname: string;
  berichtNr: string;
  kunde: string;
  kundeAdresse?: string;
  kundeEmail?: string;
  kampagnentyp?: string;
  beschreibung?: string;
  briefing?: string;

  // Zeitraum
  startDatum: string;
  abschlussDatum: string;
  projektDauer: number;

  // Team
  team: AbschlussTeamMember[];

  // Zeiterfassung
  zeitProUser: AbschlussZeitUser[];
  stundenGesamt: number;

  // Aufgaben
  aufgaben: { offen: number; inArbeit: number; erledigt: number; gesamt: number };

  // Equipment
  equipment: AbschlussEquipment[];

  // Finanzen
  stundenSatz: number;
  zeitKosten: number;
  eqKosten: number;
  steuerProzent: number;
  steuerRücklage: number;
  investProzent: number;
  investRücklage: number;
  gesamtKosten: number;
  einnahmen: number | null;
  gewinn: number | null;

  // Meta
  erstelltAm: string;
  erstelltVon: string;
}

// Brand colours
const B = { r: 0, g: 25, b: 46 };
const ACCENT = { r: 16, g: 185, b: 129 };
const WARN = { r: 245, g: 158, b: 11 };
const GRAY = { r: 120, g: 130, b: 140 };
const LIGHT_BG: [number, number, number] = [239, 242, 249];
const RED = { r: 239, g: 68, b: 68 };
const BLUE = { r: 59, g: 130, b: 246 };

function eur(v: number): string {
  return v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function n2(v: number): string {
  return v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function sectionHeader(doc: jsPDF, y: number, label: string, ml: number, mr: number): number {
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(ml - 2, y - 4, mr - ml + 4, 7, 1, 1, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(B.r, B.g, B.b);
  doc.text(label, ml, y);
  return y + 7;
}

function kvRow(doc: jsPDF, y: number, label: string, value: string, ml: number, mr: number): number {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(label, ml + 2, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(B.r, B.g, B.b);
  // Wrap long values
  const maxWidth = mr - ml - 32;
  const lines = doc.splitTextToSize(value, maxWidth) as string[];
  doc.text(lines, ml + 32, y);
  return y + (lines.length > 1 ? lines.length * 4.5 + 1 : 5);
}

function checkPage(doc: jsPDF, y: number, ph: number, needed = 60): number {
  if (y > ph - needed) {
    doc.addPage();
    return 20;
  }
  return y;
}

export async function generateProjektabschlussPdf(data: PdfAbschlussData): Promise<jsPDF> {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const ml = 18;
  const mr = pw - 18;

  // ---- HEADER ----
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
  doc.text('Projektabschlussbericht', mr, 18, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
  doc.text(data.erstelltAm, mr, 24, { align: 'right' });

  doc.setDrawColor(B.r, B.g, B.b);
  doc.setLineWidth(0.4);
  doc.line(ml, 31, mr, 31);

  doc.setFontSize(7);
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
  doc.setFont('helvetica', 'normal');
  doc.text(`Erstellt von ${data.erstelltVon}  •  ${data.erstelltAm}  •  Berichts-Nr: ${data.berichtNr}`, ml, 37);

  let y = 45;

  // ---- PROJEKTINFORMATIONEN ----
  y = sectionHeader(doc, y, 'Projektinformationen', ml, mr);
  y = kvRow(doc, y, 'Projekt:', data.projektname || '—', ml, mr);
  y = kvRow(doc, y, 'Kunde:', data.kunde || '—', ml, mr);
  if (data.kundeAdresse) y = kvRow(doc, y, 'Adresse:', data.kundeAdresse, ml, mr);
  if (data.kundeEmail) y = kvRow(doc, y, 'E-Mail:', data.kundeEmail, ml, mr);
  if (data.kampagnentyp) y = kvRow(doc, y, 'Typ:', data.kampagnentyp, ml, mr);
  y += 5;

  // ---- PROJEKTZEITRAUM ----
  y = checkPage(doc, y, ph, 50);
  y = sectionHeader(doc, y, 'Projektzeitraum', ml, mr);
  y = kvRow(doc, y, 'Start:', data.startDatum, ml, mr);
  y = kvRow(doc, y, 'Abschluss:', data.abschlussDatum, ml, mr);
  y = kvRow(doc, y, 'Dauer:', `${data.projektDauer} Tage`, ml, mr);
  if (data.beschreibung) {
    const lines = doc.splitTextToSize(data.beschreibung, mr - ml - 4) as string[];
    const preview = lines.slice(0, 4);
    y = kvRow(doc, y, 'Beschreibung:', preview.join(' '), ml, mr);
  }
  if (data.briefing) {
    const lines = doc.splitTextToSize(data.briefing, mr - ml - 4) as string[];
    const preview = lines.slice(0, 4);
    y = kvRow(doc, y, 'Briefing:', preview.join(' '), ml, mr);
  }
  y += 5;

  // ---- PROJEKTTEAM ----
  if (data.team.length > 0) {
    y = checkPage(doc, y, ph, 40);
    y = sectionHeader(doc, y, `Projektteam (${data.team.length} Mitglieder)`, ml, mr);

    autoTable(doc, {
      startY: y,
      head: [['Name', 'Rolle', 'Typ']],
      body: data.team.map((m) => [
        m.name,
        TEAM_ROLE_LABELS[m.role] ?? m.role,
        m.extern ? 'Extern' : 'Intern',
      ]),
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2.5, textColor: [60, 60, 60], lineColor: [200, 210, 220], lineWidth: 0.2 },
      headStyles: { fillColor: [B.r, B.g, B.b], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: LIGHT_BG },
      columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 55 }, 2: { cellWidth: 22, halign: 'center' } },
      margin: { left: ml },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // ---- ZEITERFASSUNG ----
  y = checkPage(doc, y, ph, 50);
  y = sectionHeader(doc, y, 'Zeiterfassung', ml, mr);

  if (data.zeitProUser.length === 0) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
    doc.text('Keine Zeiteinträge erfasst.', ml + 2, y);
    y += 8;
  } else {
    const zeitBody = data.zeitProUser.map((u) => [u.name, `${n2(u.stunden)} Std`]);
    zeitBody.push(['Gesamt', `${n2(data.stundenGesamt)} Std`]);

    autoTable(doc, {
      startY: y,
      head: [['Mitarbeiter', 'Stunden']],
      body: zeitBody,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2.5, textColor: [60, 60, 60], lineColor: [200, 210, 220], lineWidth: 0.2 },
      headStyles: { fillColor: [B.r, B.g, B.b], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: LIGHT_BG },
      columnStyles: { 0: { cellWidth: 'auto' }, 1: { halign: 'right', cellWidth: 35 } },
      didParseCell: (hookData) => {
        if (hookData.row.index === zeitBody.length - 1) {
          hookData.cell.styles.fontStyle = 'bold';
          hookData.cell.styles.textColor = [ACCENT.r, ACCENT.g, ACCENT.b];
        }
      },
      margin: { left: ml },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // ---- AUFGABENSTATUS ----
  y = checkPage(doc, y, ph, 30);
  y = sectionHeader(doc, y, 'Aufgaben', ml, mr);

  const boxW = (mr - ml - 4) / 3;
  const boxes = [
    { label: 'Offen', count: data.aufgaben.offen, color: WARN },
    { label: 'In Arbeit', count: data.aufgaben.inArbeit, color: BLUE },
    { label: 'Erledigt', count: data.aufgaben.erledigt, color: ACCENT },
  ];
  boxes.forEach((box, i) => {
    const bx = ml + i * (boxW + 2);
    doc.setFillColor(box.color.r, box.color.g, box.color.b);
    doc.setGState(doc.GState({ opacity: 0.12 }));
    doc.roundedRect(bx, y - 2, boxW, 12, 1.5, 1.5, 'F');
    doc.setGState(doc.GState({ opacity: 1 }));
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(box.color.r, box.color.g, box.color.b);
    doc.text(String(box.count), bx + boxW / 2, y + 4, { align: 'center' });
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text(box.label, bx + boxW / 2, y + 8.5, { align: 'center' });
  });
  y += 16;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
  doc.text(`Gesamt: ${data.aufgaben.gesamt} Aufgaben`, ml + 2, y);
  y += 8;

  // ---- EQUIPMENT ----
  if (data.equipment.length > 0) {
    y = checkPage(doc, y, ph, 40);
    y = sectionHeader(doc, y, 'Equipment', ml, mr);

    autoTable(doc, {
      startY: y,
      head: [['Name', 'Kategorie', 'Tage', 'Tagessatz', 'Gesamt']],
      body: data.equipment.map((e) => [
        e.name,
        e.kategorie || '—',
        String(e.tage),
        eur(e.tagessatz),
        eur(e.gesamt),
      ]),
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2.5, textColor: [60, 60, 60], lineColor: [200, 210, 220], lineWidth: 0.2 },
      headStyles: { fillColor: [B.r, B.g, B.b], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: LIGHT_BG },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 30 },
        2: { halign: 'right', cellWidth: 15 },
        3: { halign: 'right', cellWidth: 28 },
        4: { halign: 'right', cellWidth: 28 },
      },
      margin: { left: ml },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // ---- FINANZÜBERSICHT ----
  y = checkPage(doc, y, ph, 90);
  y = sectionHeader(doc, y, 'Finanzübersicht', ml, mr);

  const finanzRows: { label: string; detail: string; value: string }[] = [
    {
      label: 'Zeitkosten',
      detail: `${n2(data.stundenGesamt)} Std × ${n2(data.stundenSatz)} €/Std`,
      value: eur(data.zeitKosten),
    },
    {
      label: `Steuerrücklage (${data.steuerProzent}%)`,
      detail: `von ${eur(data.einnahmen ?? data.zeitKosten)}`,
      value: eur(data.steuerRücklage),
    },
    {
      label: `Investrücklage (${data.investProzent}%)`,
      detail: `von ${eur(data.einnahmen ?? data.zeitKosten)}`,
      value: eur(data.investRücklage),
    },
    {
      label: 'Equipmentkosten',
      detail: '',
      value: eur(data.eqKosten),
    },
  ];

  for (const row of finanzRows) {
    doc.setFillColor(...LIGHT_BG);
    doc.rect(ml, y - 4, mr - ml, 8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(row.label, ml + 2, y);
    if (row.detail) {
      doc.setFontSize(7);
      doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
      doc.text(row.detail, ml + 60, y);
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

  // Gesamtkosten
  doc.setFillColor(B.r, B.g, B.b);
  doc.rect(ml, y - 4, mr - ml, 10, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Gesamtkosten (netto)', ml + 2, y + 1);
  doc.setTextColor(ACCENT.r, ACCENT.g, ACCENT.b);
  doc.text(eur(data.gesamtKosten), mr - 2, y + 1, { align: 'right' });
  y += 14;

  // Einnahmen (Budget)
  if (data.einnahmen !== null) {
    doc.setFillColor(...LIGHT_BG);
    doc.rect(ml, y - 4, mr - ml, 8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text('Einnahmen (Budget)', ml + 2, y);
    doc.text(eur(data.einnahmen), mr - 2, y, { align: 'right' });
    y += 9;

    // Gewinn / Verlust
    if (data.gewinn !== null) {
      const isPositive = data.gewinn >= 0;
      const gewinnColor = isPositive ? ACCENT : RED;
      doc.setFillColor(gewinnColor.r, gewinnColor.g, gewinnColor.b);
      doc.setGState(doc.GState({ opacity: 0.15 }));
      doc.rect(ml, y - 4, mr - ml, 10, 'F');
      doc.setGState(doc.GState({ opacity: 1 }));
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(gewinnColor.r, gewinnColor.g, gewinnColor.b);
      doc.text(isPositive ? 'Gewinn' : 'Verlust', ml + 2, y + 1);
      doc.text(eur(Math.abs(data.gewinn)), mr - 2, y + 1, { align: 'right' });
      y += 14;
    }
  }

  // Hinweis
  y = checkPage(doc, y, ph, 20);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(WARN.r, WARN.g, WARN.b);
  doc.text('Alle Beträge zzgl. gesetzlicher Mehrwertsteuer. Zeitkosten basieren auf internem Stundensatz.', ml, y);

  // ---- FOOTER ----
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
  doc.text(`Erstellt am ${data.erstelltAm} von ${data.erstelltVon}`, pw / 2, ph - 6.5, { align: 'center' });

  return doc;
}

// Helper: Assemble PdfAbschlussData from raw Supabase results
export function buildAbschlussData({
  project,
  timeEntries,
  team,
  equipment,
  tasks,
  kundeData,
  settings,
}: {
  project: {
    id: string;
    name: string;
    client_name: string | null;
    campaign_type: string | null;
    description: string | null;
    briefing_description: string | null;
    budget: number | null;
    created_at: string;
    completed_at: string | null;
    updated_at: string;
  };
  timeEntries: { user_id: string; duration_minutes: number | null; profiles: { full_name: string } | null }[] | null;
  team: { user_id: string | null; external_name: string | null; role: string; profiles: { full_name: string } | null }[] | null;
  equipment: { name: string; category: string | null; day_rate: number | null; days_count: number | null }[] | null;
  tasks: { status: string }[] | null;
  kundeData: { firma: string; ansprechpartner: string | null; email: string | null; strasse: string | null; plz: string | null; stadt: string | null } | null;
  settings: { stundenSatz: number; steuerProzent: number; investProzent: number };
}): PdfAbschlussData {
  const completedAt = project.completed_at ?? project.updated_at;
  const createdDate = new Date(project.created_at);
  const completedDate = new Date(completedAt);
  const projektDauer = Math.max(1, Math.ceil((completedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));

  const fmt = (d: Date) => d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const now = new Date();

  // Time grouping by user
  const zeitMap = new Map<string, { name: string; minutes: number }>();
  for (const te of (timeEntries ?? [])) {
    const name = te.profiles?.full_name ?? 'Unbekannt';
    const key = te.user_id;
    const existing = zeitMap.get(key);
    if (existing) {
      existing.minutes += te.duration_minutes ?? 0;
    } else {
      zeitMap.set(key, { name, minutes: te.duration_minutes ?? 0 });
    }
  }
  const zeitProUser = Array.from(zeitMap.values())
    .map((u) => ({ name: u.name, stunden: Math.round((u.minutes / 60) * 100) / 100 }))
    .filter((u) => u.stunden > 0)
    .sort((a, b) => b.stunden - a.stunden);
  const stundenGesamt = Math.round(zeitProUser.reduce((s, u) => s + u.stunden, 0) * 100) / 100;

  // Equipment costs
  const eqRows = (equipment ?? []).map((e) => ({
    name: e.name,
    kategorie: e.category ?? '',
    tage: e.days_count ?? 0,
    tagessatz: e.day_rate ?? 0,
    gesamt: (e.day_rate ?? 0) * (e.days_count ?? 0),
  }));
  const eqKosten = Math.round(eqRows.reduce((s, e) => s + e.gesamt, 0) * 100) / 100;

  // Financial calculations
  const einnahmen = project.budget ?? null;
  const zeitKosten = Math.round(stundenGesamt * settings.stundenSatz * 100) / 100;
  // Steuer-/Investitionsrücklage auf Budget (Einnahmen); Fallback auf Zeitkosten wenn kein Budget hinterlegt
  const rücklagenBasis = einnahmen ?? zeitKosten;
  const steuerRücklage = Math.round(rücklagenBasis * (settings.steuerProzent / 100) * 100) / 100;
  const investRücklage = Math.round(rücklagenBasis * (settings.investProzent / 100) * 100) / 100;
  const gesamtKosten = Math.round((zeitKosten + steuerRücklage + investRücklage + eqKosten) * 100) / 100;
  const gewinn = einnahmen !== null ? Math.round((einnahmen - gesamtKosten) * 100) / 100 : null;

  // Task counts
  const aufgaben = (tasks ?? []).reduce(
    (acc, t) => {
      if (t.status === 'offen') acc.offen++;
      else if (t.status === 'in_arbeit') acc.inArbeit++;
      else if (t.status === 'erledigt') acc.erledigt++;
      return acc;
    },
    { offen: 0, inArbeit: 0, erledigt: 0, gesamt: tasks?.length ?? 0 }
  );

  // Team
  const teamMembers = (team ?? []).map((m) => ({
    name: m.profiles?.full_name ?? m.external_name ?? 'Unbekannt',
    role: m.role,
    extern: !m.user_id,
  }));

  // Kunde
  const kundeName = kundeData?.firma ?? project.client_name ?? '—';
  const kundeAdressParts = [kundeData?.strasse, [kundeData?.plz, kundeData?.stadt].filter(Boolean).join(' ')].filter(Boolean);
  const kundeAdresse = kundeAdressParts.length > 0 ? kundeAdressParts.join(', ') : undefined;

  // Berichts-Nr
  const year = createdDate.getFullYear();
  const shortId = project.id.replace(/-/g, '').slice(0, 6).toUpperCase();
  const berichtNr = `AB-${year}-${shortId}`;

  return {
    projektname: project.name,
    berichtNr,
    kunde: kundeName,
    kundeAdresse,
    kundeEmail: kundeData?.email ?? undefined,
    kampagnentyp: project.campaign_type ? CAMPAIGN_TYPE_LABELS[project.campaign_type] : undefined,
    beschreibung: project.description ?? undefined,
    briefing: project.briefing_description ?? undefined,
    startDatum: fmt(createdDate),
    abschlussDatum: fmt(completedDate),
    projektDauer,
    team: teamMembers,
    zeitProUser,
    stundenGesamt,
    aufgaben,
    equipment: eqRows.filter((e) => e.tage > 0),
    stundenSatz: settings.stundenSatz,
    zeitKosten,
    eqKosten,
    steuerProzent: settings.steuerProzent,
    steuerRücklage,
    investProzent: settings.investProzent,
    investRücklage,
    gesamtKosten,
    einnahmen,
    gewinn,
    erstelltAm: fmt(now),
    erstelltVon: '',
  };
}
