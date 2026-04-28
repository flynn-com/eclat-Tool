import { NavItem } from './types';

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard', roles: ['admin', 'employee'] },
  { label: 'Aufgaben', href: '/aufgaben', icon: 'CheckSquare', roles: ['admin', 'employee'] },
  { label: 'Meetings', href: '/meetings', icon: 'MessageSquare', roles: ['admin', 'employee'] },
  { label: 'Zeiterfassung', href: '/zeiterfassung', icon: 'Clock', roles: ['admin', 'employee'] },
  { label: 'Finanzen', href: '/finanzen', icon: 'Calculator', roles: ['admin'] },
  { label: 'Projekte', href: '/projekte', icon: 'FolderKanban', roles: ['admin', 'employee'] },
  { label: 'Vertrieb', href: '/vertrieb', icon: 'Users', roles: ['admin'] },
  { label: 'Equipment', href: '/equipment', icon: 'Wrench', roles: ['admin', 'employee'] },
  { label: 'Einstellungen', href: '/einstellungen', icon: 'Settings', roles: ['admin'] },
];

export const ADMIN_ONLY_ROUTES = ['/finanzen', '/vertrieb', '/einstellungen'];

export const PHASE_LABELS: Record<string, string> = {
  planung: 'Planung',
  produktion: 'Produktion',
  postproduktion: 'Post-Produktion',
  review: 'Review',
  abgeschlossen: 'Abgeschlossen',
};

export const PHASE_COLORS: Record<string, string> = {
  planung: '#3B82F6',
  produktion: '#F59E0B',
  postproduktion: '#8B5CF6',
  review: '#06B6D4',
  abgeschlossen: '#10B981',
};

export const CAMPAIGN_TYPE_LABELS: Record<string, string> = {
  film: 'Film',
  foto: 'Foto',
  social_media: 'Social Media',
  animation: 'Animation',
  audio: 'Audio',
  mixed: 'Mixed',
};

export const NOTE_CATEGORY_LABELS: Record<string, string> = {
  brainstorming: 'Brainstorming',
  moodboard: 'Moodboard',
  marktanalyse: 'Marktanalyse',
  strategie: 'Strategieplanung',
  shooting_planung: 'Shooting-Planung',
  storyboard_shotlist: 'Storyboard / Shotlist',
  produktion_notizen: 'Notizen',
  sonstiges: 'Sonstiges',
};

export const TEAM_ROLE_LABELS: Record<string, string> = {
  projektleitung: 'Projektleitung',
  kamera: 'Kamera',
  regie: 'Regie',
  licht: 'Licht',
  ton: 'Ton',
  editor: 'Editor',
  colorist: 'Colorist',
  grafik: 'Grafik',
  model_talent: 'Model / Talent',
  sonstiges: 'Sonstiges',
};

export const EQUIPMENT_STATUS_LABELS: Record<string, string> = {
  geplant: 'Geplant',
  bestaetigt: 'Bestaetigt',
  gepackt: 'Gepackt',
  vor_ort: 'Vor Ort',
  zurueck: 'Zurueck',
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  offen: 'Offen',
  in_arbeit: 'In Arbeit',
  erledigt: 'Erledigt',
};

export const POST_PRODUCTION_CATEGORIES = [
  { key: 'schnitt', label: 'Schnitt / Edit' },
  { key: 'colorgrading', label: 'Colorgrading' },
  { key: 'animation_vfx', label: 'Animation / VFX' },
  { key: 'bildbearbeitung', label: 'Bildbearbeitung' },
  { key: 'untertitel', label: 'Untertitel' },
  { key: 'sound_audio', label: 'Sound / Audio' },
];
