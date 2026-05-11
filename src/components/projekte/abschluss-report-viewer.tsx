'use client';

import { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import type { PdfAbschlussData } from '@/lib/pdf-projektabschluss';

function eur(v: number) {
  return v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function n2(v: number) {
  return v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface Props {
  data: PdfAbschlussData;
}

export function AbschlussReportViewer({ data }: Props) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const { generateProjektabschlussPdf } = await import('@/lib/pdf-projektabschluss');
      const doc = await generateProjektabschlussPdf(data);
      const filename = `Abschlussbericht_${data.projektname.replace(/\s+/g, '_')}_${data.abschlussDatum.replace(/\./g, '-')}.pdf`;
      doc.save(filename);
    } finally {
      setLoading(false);
    }
  };

  const gewinnColor =
    data.gewinn === null ? 'var(--neu-text-secondary)' : data.gewinn >= 0 ? '#10b981' : '#ef4444';

  return (
    <div className="space-y-5">
      {/* Title row */}
      <div className="neu-raised p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-5 w-5" style={{ color: 'var(--neu-accent)' }} />
              <h2
                className="text-xl font-bold"
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}
              >
                Projektabschlussbericht
              </h2>
            </div>
            <p className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>
              Berichts-Nr: <span className="font-mono font-medium">{data.berichtNr}</span>
              {' · '}Erstellt am {data.erstelltAm}
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={loading}
            className="neu-btn-primary flex items-center gap-2 px-5 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {loading ? 'Wird erstellt…' : 'Als PDF exportieren'}
          </button>
        </div>
      </div>

      {/* Projektinfo + Zeitraum */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="neu-raised p-5">
          <h3
            className="text-sm font-semibold mb-3"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}
          >
            Projektinformationen
          </h3>
          <dl className="space-y-1.5">
            {[
              ['Projekt', data.projektname],
              ['Kunde', data.kunde],
              ...(data.kundeAdresse ? [['Adresse', data.kundeAdresse]] : []),
              ...(data.kundeEmail ? [['E-Mail', data.kundeEmail]] : []),
              ...(data.kampagnentyp ? [['Typ', data.kampagnentyp]] : []),
            ].map(([label, value]) => (
              <div key={label} className="flex gap-2 text-sm">
                <dt className="w-20 flex-shrink-0" style={{ color: 'var(--neu-text-secondary)' }}>
                  {label}
                </dt>
                <dd className="font-medium" style={{ color: 'var(--neu-text)' }}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          {data.beschreibung && (
            <p className="mt-3 text-xs line-clamp-3" style={{ color: 'var(--neu-text-secondary)' }}>
              {data.beschreibung}
            </p>
          )}
        </div>

        <div className="neu-raised p-5">
          <h3
            className="text-sm font-semibold mb-3"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}
          >
            Projektzeitraum
          </h3>
          <dl className="space-y-1.5">
            {[
              ['Start', data.startDatum],
              ['Abschluss', data.abschlussDatum],
              ['Dauer', `${data.projektDauer} Tage`],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-2 text-sm">
                <dt className="w-20 flex-shrink-0" style={{ color: 'var(--neu-text-secondary)' }}>
                  {label}
                </dt>
                <dd className="font-medium" style={{ color: 'var(--neu-text)' }}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Team + Zeiterfassung */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {data.team.length > 0 && (
          <div className="neu-raised p-5">
            <h3
              className="text-sm font-semibold mb-3"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}
            >
              Projektteam ({data.team.length})
            </h3>
            <div className="space-y-2">
              {data.team.map((m, i) => (
                <div key={i} className="neu-pressed px-3 py-2 rounded-xl flex items-center gap-2">
                  <span className="flex-1 text-sm font-medium" style={{ color: 'var(--neu-text)' }}>
                    {m.name}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>
                    {m.role}
                  </span>
                  {m.extern && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full"
                      style={{ background: 'var(--neu-surface)', color: 'var(--neu-accent)' }}
                    >
                      Extern
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="neu-raised p-5">
          <h3
            className="text-sm font-semibold mb-3"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}
          >
            Zeiterfassung
          </h3>
          {data.zeitProUser.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--neu-text-secondary)' }}>
              Keine Zeiteinträge erfasst.
            </p>
          ) : (
            <div className="space-y-1.5">
              {data.zeitProUser.map((u) => (
                <div key={u.name} className="neu-pressed px-3 py-2 rounded-xl flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: 'var(--neu-text)' }}>
                    {u.name}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--neu-accent)' }}>
                    {n2(u.stunden)} Std
                  </span>
                </div>
              ))}
              <div className="neu-pressed px-3 py-2 rounded-xl flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>
                  Gesamt
                </span>
                <span className="text-sm font-bold" style={{ color: 'var(--neu-accent)' }}>
                  {n2(data.stundenGesamt)} Std
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Aufgaben */}
      <div className="neu-raised p-5">
        <h3
          className="text-sm font-semibold mb-3"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}
        >
          Aufgaben ({data.aufgaben.gesamt} gesamt)
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Offen', count: data.aufgaben.offen, color: '#f59e0b' },
            { label: 'In Arbeit', count: data.aufgaben.inArbeit, color: '#3b82f6' },
            { label: 'Erledigt', count: data.aufgaben.erledigt, color: '#10b981' },
          ].map((s) => (
            <div key={s.label} className="neu-pressed p-3 rounded-xl text-center">
              <p className="text-2xl font-bold" style={{ color: s.color }}>
                {s.count}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--neu-text-secondary)' }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Equipment */}
      {data.equipment.length > 0 && (
        <div className="neu-raised p-5">
          <h3
            className="text-sm font-semibold mb-3"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}
          >
            Equipment
          </h3>
          <div className="space-y-1.5">
            {data.equipment.map((e, i) => (
              <div key={i} className="neu-pressed px-3 py-2 rounded-xl flex items-center gap-2 flex-wrap">
                <span className="flex-1 text-sm font-medium" style={{ color: 'var(--neu-text)' }}>
                  {e.name}
                </span>
                {e.kategorie && (
                  <span className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>
                    {e.kategorie}
                  </span>
                )}
                <span className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>
                  {e.tage} T × {eur(e.tagessatz)}
                </span>
                <span className="text-sm font-medium w-24 text-right" style={{ color: 'var(--neu-text)' }}>
                  {eur(e.gesamt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Finanzübersicht */}
      <div className="neu-raised p-5">
        <h3
          className="text-sm font-semibold mb-3"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}
        >
          Finanzübersicht
        </h3>
        <div className="space-y-1.5">
          {[
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
            { label: 'Equipmentkosten', detail: '', value: eur(data.eqKosten) },
          ].map((row) => (
            <div key={row.label} className="neu-pressed px-4 py-2 flex justify-between rounded-xl items-center">
              <div>
                <span className="text-sm" style={{ color: 'var(--neu-text)' }}>
                  {row.label}
                </span>
                {row.detail && (
                  <span className="text-xs ml-2" style={{ color: 'var(--neu-text-secondary)' }}>
                    {row.detail}
                  </span>
                )}
              </div>
              <span className="text-sm font-medium w-28 text-right" style={{ color: 'var(--neu-text)' }}>
                {row.value}
              </span>
            </div>
          ))}

          <div className="h-px" style={{ background: 'var(--neu-border)' }} />

          <div className="neu-pressed px-4 py-3 flex justify-between rounded-xl items-center">
            <span className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
              Gesamtkosten (netto)
            </span>
            <span className="text-lg font-bold" style={{ color: 'var(--neu-accent)' }}>
              {eur(data.gesamtKosten)}
            </span>
          </div>

          {data.einnahmen !== null && (
            <div className="neu-pressed px-4 py-2 flex justify-between rounded-xl items-center">
              <span className="text-sm" style={{ color: 'var(--neu-text)' }}>
                Einnahmen (Budget)
              </span>
              <span className="text-sm font-medium w-28 text-right" style={{ color: 'var(--neu-text)' }}>
                {eur(data.einnahmen)}
              </span>
            </div>
          )}

          {data.gewinn !== null && (
            <div className="neu-pressed px-4 py-3 flex justify-between rounded-xl items-center">
              <span className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
                {data.gewinn >= 0 ? 'Gewinn' : 'Verlust'}
              </span>
              <span className="text-lg font-bold" style={{ color: gewinnColor }}>
                {eur(Math.abs(data.gewinn))}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
