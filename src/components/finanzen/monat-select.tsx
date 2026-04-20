'use client';

import { useRouter } from 'next/navigation';

interface Props {
  value: string;
  options: { value: string; label: string }[];
  basePath?: string;
}

export function MonatSelect({ value, options, basePath = '/finanzen/monatsabrechnung' }: Props) {
  const router = useRouter();

  return (
    <select
      value={value}
      onChange={(e) => router.push(`${basePath}?monat=${e.target.value}`)}
      className="neu-input text-sm py-1.5 px-3"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
