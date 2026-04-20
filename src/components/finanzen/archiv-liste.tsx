'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Download } from 'lucide-react';
import { generateGewinnverteilungPdf } from '@/lib/pdf-gewinnverteilung';

interface Position {
  name: string;
  stunden: number;
  anteilGleich: number;
  anteilStunden: number;
  bonus: number;
  gesamt: number;
  stundenlohn: number;
}

interface Verteilung {
  id: string;
  gesamtgewinn: number;
  gewinn_nach_bonus: number;
  gesamt_bonus: number;
  steuerruecklage: number;
  verteilung_prozent: { gleich: number; stunden: number; steuer: number };
  positionen: Position[];
  created_at: string;
  profiles: { full_name: string } | null;
}

interface Props {
  verteilungen: Verteilung[];
}

function formatEuro(value: number): string {
  return value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

function formatDatum(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ArchivListe({ verteilungen }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const downloadPdf = (v: Verteilung) => {
    const datum = new Date(v.created_at).toLocaleDateString('de-DE');
    const doc = generateGewinnverteilungPdf({
      gesamtgewinn: v.gesamtgewinn,
      gewinnNachBonus: v.gewinn_nach_bonus,
      gesamtBonus: v.gesamt_bonus,
      steuerruecklage: v.steuerruecklage,
      verteilungProzent: v.verteilung_prozent,
      positionen: v.positionen,
      erstelltVon: v.profiles?.full_name ?? 'Unbekannt',
      datum,
    });
    doc.save(`Gewinnverteilung_${datum.replace(/\./g, '-')}.pdf`);
  };

  if (verteilungen.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
        Noch keine Gewinnverteilungen archiviert
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {verteilungen.map((v) => {
        const isExpanded = expandedId === v.id;
        const datum = formatDatum(v.created_at);
        const erstelltVon = v.profiles?.full_name ?? 'Unbekannt';

        return (
          <div key={v.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : v.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
            >
              <div>
                <p className="font-semibold text-gray-900">{formatEuro(v.gesamtgewinn)} Gesamtgewinn</p>
                <p className="text-sm text-gray-500">{datum} — von {erstelltVon}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">
                  {v.positionen.length} Personen
                </span>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </div>
            </button>

            {/* Details */}
            {isExpanded && (
              <div className="border-t border-gray-200 p-4 space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500">Gesamtgewinn</p>
                    <p className="font-bold">{formatEuro(v.gesamtgewinn)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500">Bonus abgezogen</p>
                    <p className="font-bold">{formatEuro(v.gesamt_bonus)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500">Nach Bonus</p>
                    <p className="font-bold">{formatEuro(v.gewinn_nach_bonus)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500">Steuerruecklage</p>
                    <p className="font-bold text-orange-600">{formatEuro(v.steuerruecklage)}</p>
                  </div>
                </div>

                {/* Positionen */}
                <div className="space-y-2">
                  {v.positionen.map((p, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-500">
                          {p.stunden} Std | Stundenlohn: {formatEuro(p.stundenlohn)}
                          {p.bonus > 0 && ` | Bonus: ${formatEuro(p.bonus)}`}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-green-600">{formatEuro(p.gesamt)}</p>
                    </div>
                  ))}
                </div>

                {/* Verteilungsschluessel */}
                <p className="text-xs text-gray-500">
                  Schluessel: {v.verteilung_prozent.gleich}% gleich / {v.verteilung_prozent.stunden}% Stunden / {v.verteilung_prozent.steuer}% Steuer
                </p>

                {/* PDF Download */}
                <button
                  onClick={() => downloadPdf(v)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Als PDF herunterladen
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
