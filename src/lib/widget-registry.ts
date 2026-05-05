export type ColSpan = 1 | 2 | 4;
export type WidgetVariant = 'full' | 'compact' | 'mini';
export type VariantLevel = 1 | 2 | 3; // 1=mini, 2=compact, 3=full

export interface WidgetMeta {
  key: string;
  group: string;
  variant: WidgetVariant;
  variantLevel: VariantLevel;
  label: string;
  description: string;
  defaultColSpan: ColSpan;
  adminOnly?: boolean;
  icon: string;
}

export const WIDGET_REGISTRY: WidgetMeta[] = [
  // Zeiterfassung
  { key: 'zeiterfassung_full',    group: 'Zeiterfassung', variant: 'full',    variantLevel: 3, label: 'Zeiterfassung Ausführlich', description: 'Stundenübersicht + Team', defaultColSpan: 4, icon: 'Clock' },
  { key: 'zeiterfassung_compact', group: 'Zeiterfassung', variant: 'compact', variantLevel: 2, label: 'Zeiterfassung Kompakt',     description: 'Stundenstand + Projekte',  defaultColSpan: 2, icon: 'Clock' },
  { key: 'zeiterfassung_mini',    group: 'Zeiterfassung', variant: 'mini',    variantLevel: 1, label: 'Zeiterfassung Mini',        description: 'Nur Stundensaldo',         defaultColSpan: 1, icon: 'Clock' },
  // Aufgaben
  { key: 'aufgaben_full',    group: 'Aufgaben', variant: 'full',    variantLevel: 3, label: 'Aufgaben Ausführlich', description: 'Aufgaben + neue erstellen',  defaultColSpan: 4, icon: 'CheckSquare' },
  { key: 'aufgaben_compact', group: 'Aufgaben', variant: 'compact', variantLevel: 2, label: 'Aufgaben Kompakt',     description: 'Aufgabenliste mit Checkbox', defaultColSpan: 2, icon: 'CheckSquare' },
  { key: 'aufgaben_mini',    group: 'Aufgaben', variant: 'mini',    variantLevel: 1, label: 'Aufgaben Mini',        description: 'Anzahl offener Aufgaben',   defaultColSpan: 1, icon: 'CheckSquare' },
  // Projekte
  { key: 'projekte_full', group: 'Projekte', variant: 'full', variantLevel: 3, label: 'Projekte Ausführlich', description: 'Aktive Projekte mit Phase', defaultColSpan: 2, icon: 'FolderKanban' },
  { key: 'projekte_mini', group: 'Projekte', variant: 'mini', variantLevel: 1, label: 'Projekte Mini',        description: 'Anzahl aktiver Projekte',  defaultColSpan: 1, icon: 'FolderKanban' },
  // Finanzen
  { key: 'finanzen_chart',   group: 'Finanzen', variant: 'full',    variantLevel: 3, label: 'Finanz-Chart',    description: 'Einnahmen & Ausgaben Diagramm', defaultColSpan: 4, adminOnly: true, icon: 'BarChart2' },
  { key: 'finanzen_compact', group: 'Finanzen', variant: 'compact', variantLevel: 2, label: 'Finanzen Kompakt', description: 'Monatliche Übersicht',         defaultColSpan: 2, adminOnly: true, icon: 'Euro' },
  { key: 'finanzen_mini',    group: 'Finanzen', variant: 'mini',    variantLevel: 1, label: 'Finanzen Mini',    description: 'Gesamtergebnis',               defaultColSpan: 1, adminOnly: true, icon: 'Euro' },
  // Meetings
  { key: 'meetings_compact', group: 'Meetings', variant: 'compact', variantLevel: 2, label: 'Meetings Kompakt', description: 'Nächste Meetings', defaultColSpan: 2, icon: 'MessageSquare' },
  { key: 'meetings_mini',    group: 'Meetings', variant: 'mini',    variantLevel: 1, label: 'Meetings Mini',    description: 'Nächstes Meeting', defaultColSpan: 1, icon: 'MessageSquare' },
  // Equipment
  { key: 'equipment_mini', group: 'Equipment', variant: 'mini', variantLevel: 1, label: 'Equipment Mini', description: 'Anzahl aktiver Geräte', defaultColSpan: 1, icon: 'Wrench' },
];

export function getWidget(key: string): WidgetMeta | undefined {
  return WIDGET_REGISTRY.find(w => w.key === key);
}

/** Alle Varianten derselben Gruppe, sortiert nach variantLevel */
export function getWidgetVariants(key: string): WidgetMeta[] {
  const meta = getWidget(key);
  if (!meta) return [];
  return WIDGET_REGISTRY
    .filter(w => w.group === meta.group)
    .sort((a, b) => a.variantLevel - b.variantLevel);
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
