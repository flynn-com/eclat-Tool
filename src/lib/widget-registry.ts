export type ColSpan = 1 | 2 | 4;
export type WidgetVariant = 'full' | 'compact' | 'mini';

export interface WidgetMeta {
  key: string;
  group: string;
  variant: WidgetVariant;
  label: string;
  description: string;
  defaultColSpan: ColSpan;
  adminOnly?: boolean;
  icon: string;
}

export const WIDGET_REGISTRY: WidgetMeta[] = [
  // Zeiterfassung
  {
    key: 'zeiterfassung_full',
    group: 'Zeiterfassung',
    variant: 'full',
    label: 'Zeiterfassung Ausführlich',
    description: 'Detaillierte Stundenübersicht mit Wochenverlauf',
    defaultColSpan: 4,
    icon: 'Clock',
  },
  {
    key: 'zeiterfassung_compact',
    group: 'Zeiterfassung',
    variant: 'compact',
    label: 'Zeiterfassung Kompakt',
    description: 'Stundenstand + letzte Einträge',
    defaultColSpan: 2,
    icon: 'Clock',
  },
  {
    key: 'zeiterfassung_mini',
    group: 'Zeiterfassung',
    variant: 'mini',
    label: 'Zeiterfassung Mini',
    description: 'Nur der aktuelle Stundensaldo',
    defaultColSpan: 1,
    icon: 'Clock',
  },
  // Aufgaben
  {
    key: 'aufgaben_full',
    group: 'Aufgaben',
    variant: 'full',
    label: 'Aufgaben Ausführlich',
    description: 'Aufgabenliste mit Status und Fälligkeit',
    defaultColSpan: 2,
    icon: 'CheckSquare',
  },
  {
    key: 'aufgaben_mini',
    group: 'Aufgaben',
    variant: 'mini',
    label: 'Aufgaben Mini',
    description: 'Anzahl offener Aufgaben',
    defaultColSpan: 1,
    icon: 'CheckSquare',
  },
  // Projekte
  {
    key: 'projekte_full',
    group: 'Projekte',
    variant: 'full',
    label: 'Projekte Ausführlich',
    description: 'Aktive Projekte mit Phase und Status',
    defaultColSpan: 2,
    icon: 'FolderKanban',
  },
  {
    key: 'projekte_mini',
    group: 'Projekte',
    variant: 'mini',
    label: 'Projekte Mini',
    description: 'Anzahl aktiver Projekte',
    defaultColSpan: 1,
    icon: 'FolderKanban',
  },
  // Finanzen
  {
    key: 'finanzen_chart',
    group: 'Finanzen',
    variant: 'full',
    label: 'Finanz-Chart',
    description: 'Einnahmen & Ausgaben als Balkendiagramm',
    defaultColSpan: 4,
    adminOnly: true,
    icon: 'BarChart2',
  },
  {
    key: 'finanzen_compact',
    group: 'Finanzen',
    variant: 'compact',
    label: 'Finanzen Kompakt',
    description: 'Monatliche Einnahmen / Ausgaben',
    defaultColSpan: 2,
    adminOnly: true,
    icon: 'Euro',
  },
  {
    key: 'finanzen_mini',
    group: 'Finanzen',
    variant: 'mini',
    label: 'Finanzen Mini',
    description: 'Aktuelles Gesamtergebnis',
    defaultColSpan: 1,
    adminOnly: true,
    icon: 'Euro',
  },
  // Meetings
  {
    key: 'meetings_compact',
    group: 'Meetings',
    variant: 'compact',
    label: 'Meetings Kompakt',
    description: 'Nächste Meetings und offene Punkte',
    defaultColSpan: 2,
    icon: 'MessageSquare',
  },
  {
    key: 'meetings_mini',
    group: 'Meetings',
    variant: 'mini',
    label: 'Meetings Mini',
    description: 'Nächstes Meeting auf einen Blick',
    defaultColSpan: 1,
    icon: 'MessageSquare',
  },
  // Equipment
  {
    key: 'equipment_mini',
    group: 'Equipment',
    variant: 'mini',
    label: 'Equipment Mini',
    description: 'Anzahl aktiver Geräte',
    defaultColSpan: 1,
    icon: 'Wrench',
  },
];

export function getWidget(key: string): WidgetMeta | undefined {
  return WIDGET_REGISTRY.find(w => w.key === key);
}

// Default widgets for new users
export const DEFAULT_WIDGETS_ADMIN: { widget_key: string; col_span: ColSpan; position: number }[] = [
  { widget_key: 'zeiterfassung_compact', col_span: 2, position: 0 },
  { widget_key: 'aufgaben_mini',         col_span: 1, position: 1 },
  { widget_key: 'projekte_mini',         col_span: 1, position: 2 },
  { widget_key: 'finanzen_chart',        col_span: 4, position: 3 },
];

export const DEFAULT_WIDGETS_EMPLOYEE: { widget_key: string; col_span: ColSpan; position: number }[] = [
  { widget_key: 'zeiterfassung_compact', col_span: 2, position: 0 },
  { widget_key: 'aufgaben_mini',         col_span: 1, position: 1 },
  { widget_key: 'projekte_mini',         col_span: 1, position: 2 },
  { widget_key: 'meetings_compact',      col_span: 2, position: 3 },
];
