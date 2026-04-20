export interface GewinnverteilungSettings {
  gleich: number;
  stunden: number;
  steuer: number;
}

export interface Staffel {
  von: number;
  bis: number;
  prozent: number;
}

export const DEFAULT_GEWINNVERTEILUNG: GewinnverteilungSettings = {
  gleich: 30,
  stunden: 40,
  steuer: 30,
};

export interface MonatsabrechnungSettings {
  steuerProzent: number;
  investProzent: number;
  anteileProzent: number;
  stundenProzent: number;
  stundenSatz: number;
  wiederholterBonusProzent: number;
}

export const DEFAULT_MONATSABRECHNUNG: MonatsabrechnungSettings = {
  steuerProzent: 15,
  investProzent: 30,
  anteileProzent: 35,
  stundenProzent: 65,
  stundenSatz: 20,
  wiederholterBonusProzent: 1,
};

export const DEFAULT_STAFFELN: Staffel[] = [
  { von: 0, bis: 8000, prozent: 5 },
  { von: 8000, bis: 20000, prozent: 3 },
  { von: 20000, bis: 50000, prozent: 2 },
  { von: 50000, bis: 200000, prozent: 1 },
];

// Server-side: load settings
export async function loadSettingsServer(key: string) {
  // Dynamic import to avoid pulling server code into client bundles
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  return data?.value ?? null;
}
