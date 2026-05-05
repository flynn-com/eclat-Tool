'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Line, ComposedChart,
} from 'recharts';

interface MonatsDaten {
  monat: string;       // "2025-03"
  label: string;       // "Mär 25"
  einnahmen: number;
  ausgaben: number;
  ergebnis: number;
}

interface Props {
  data: MonatsDaten[];
  compact?: boolean;
}

function eur(v: number) {
  return v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl p-3 text-xs space-y-1"
      style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', color: 'var(--neu-text)' }}>
      <p className="font-bold mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span style={{ color: 'var(--neu-text-secondary)' }}>{p.name}:</span>
          <span className="font-semibold">{eur(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export function FinanzChart({ data, compact = false }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm" style={{ color: 'var(--neu-text-secondary)' }}>
        Noch keine Abrechnungsdaten vorhanden
      </div>
    );
  }

  const height = compact ? 160 : 280;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: compact ? 10 : 11, fill: 'var(--neu-text-secondary)' }}
          axisLine={false}
          tickLine={false}
        />
        {!compact && (
          <YAxis
            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
            tick={{ fontSize: 10, fill: 'var(--neu-text-secondary)' }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
        )}
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        {!compact && <Legend wrapperStyle={{ fontSize: 11, color: 'var(--neu-text-secondary)' }} />}
        <Bar dataKey="einnahmen" name="Einnahmen" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
        <Bar dataKey="ausgaben" name="Ausgaben" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
        <Line dataKey="ergebnis" name="Ergebnis" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} type="monotone" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
