'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, Phone, Mail, MapPin, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { deleteKunde } from '@/app/(protected)/vertrieb/actions';
import { Kunde } from '@/lib/types';

interface Props {
  kunden: Kunde[];
}

const statusColors: Record<string, string> = {
  aktiv: '#10B981',
  inaktiv: '#9CA3AF',
  lead: '#F59E0B',
};

const statusLabels: Record<string, string> = {
  aktiv: 'Aktiv',
  inaktiv: 'Inaktiv',
  lead: 'Lead',
};

export function KundenListe({ kunden }: Props) {
  const [filter, setFilter] = useState<'alle' | 'aktiv' | 'lead' | 'inaktiv'>('alle');
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const router = useRouter();

  const filtered = kunden.filter((k) => {
    if (filter !== 'alle' && k.status !== filter) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      return k.firma.toLowerCase().includes(s)
        || (k.ansprechpartner?.toLowerCase().includes(s) ?? false)
        || (k.email?.toLowerCase().includes(s) ?? false)
        || (k.stadt?.toLowerCase().includes(s) ?? false);
    }
    return true;
  });

  const handleDelete = async (kunde: Kunde) => {
    if (!confirm(`Kunde "${kunde.firma}" wirklich loeschen?`)) return;
    setMenuOpen(null);
    await deleteKunde(kunde.id);
    router.refresh();
  };

  return (
    <div>
      {/* Filter + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'alle', label: 'Alle' },
            { key: 'aktiv', label: 'Aktiv' },
            { key: 'lead', label: 'Leads' },
            { key: 'inaktiv', label: 'Inaktiv' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as typeof filter)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f.key ? 'neu-pressed' : 'neu-raised-sm'}`}
              style={{ color: filter === f.key ? 'var(--neu-accent)' : 'var(--neu-accent-mid)' }}
            >
              {f.label} {filter === f.key && `(${filtered.length})`}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Suchen (Firma, Ansprechpartner, Stadt...)"
          className="neu-input flex-1 text-sm py-2"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="neu-raised p-8 text-center" style={{ color: 'var(--neu-accent-mid)' }}>
          {kunden.length === 0 ? 'Noch keine Kunden angelegt' : 'Keine Treffer'}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((k) => (
            <div key={k.id} className="neu-raised p-4 relative">
              {/* Menu */}
              <div className="absolute top-3 right-3">
                <button
                  onClick={() => setMenuOpen(menuOpen === k.id ? null : k.id)}
                  className="neu-btn h-7 w-7 flex items-center justify-center"
                >
                  <MoreVertical className="h-3.5 w-3.5" style={{ color: 'var(--neu-accent)' }} />
                </button>
                {menuOpen === k.id && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                    <div className="absolute right-0 top-9 z-20 neu-raised py-2 min-w-[160px]" style={{ background: 'var(--neu-bg)' }}>
                      <Link href={`/vertrieb/kunden/${k.id}`} className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:opacity-70 text-left" style={{ color: 'var(--neu-text)' }}>
                        <Pencil className="h-4 w-4" /> Bearbeiten
                      </Link>
                      <button onClick={() => handleDelete(k)} className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:opacity-70 text-left" style={{ color: '#EF4444' }}>
                        <Trash2 className="h-4 w-4" /> Loeschen
                      </button>
                    </div>
                  </>
                )}
              </div>

              <Link href={`/vertrieb/kunden/${k.id}`} className="block pr-8">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--neu-accent)' }} />
                  <h3 className="font-bold truncate" style={{ color: 'var(--neu-text)' }}>{k.firma}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white whitespace-nowrap" style={{ background: statusColors[k.status] }}>
                    {statusLabels[k.status]}
                  </span>
                </div>
                {k.ansprechpartner && (
                  <p className="text-sm mb-2" style={{ color: 'var(--neu-text-secondary)' }}>{k.ansprechpartner}</p>
                )}
                <div className="space-y-1 text-xs" style={{ color: 'var(--neu-accent-mid)' }}>
                  {k.email && (
                    <div className="flex items-center gap-2"><Mail className="h-3 w-3" /> {k.email}</div>
                  )}
                  {k.telefon && (
                    <div className="flex items-center gap-2"><Phone className="h-3 w-3" /> {k.telefon}</div>
                  )}
                  {(k.stadt || k.plz) && (
                    <div className="flex items-center gap-2"><MapPin className="h-3 w-3" /> {[k.plz, k.stadt].filter(Boolean).join(' ')}</div>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
