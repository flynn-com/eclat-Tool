'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { MessageCirclePlus, X, Bug, Lightbulb, MessageSquare, CheckCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { createReport } from '@/lib/actions/reports';
import { ReportType } from '@/lib/types';

const TYPES: { value: ReportType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'bug',       label: 'Bug',     icon: <Bug className="h-4 w-4" />,         color: '#ef4444' },
  { value: 'feature',   label: 'Feature', icon: <Lightbulb className="h-4 w-4" />,   color: '#f59e0b' },
  { value: 'sonstiges', label: 'Sonstiges',icon: <MessageSquare className="h-4 w-4" />, color: '#6b7280' },
];

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ReportType>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && !success) {
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [open, success]);

  function handleOpen() {
    setOpen(true);
    setSuccess(false);
    setError(null);
    setTitle('');
    setDescription('');
    setType('bug');
  }

  function handleClose() {
    setOpen(false);
    setSuccess(false);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await createReport(type, title, description, pathname);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => setOpen(false), 1800);
      }
    });
  }

  const selectedType = TYPES.find(t => t.value === type)!;

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={handleOpen}
        title="Feedback senden"
        className="feedback-btn-pos fixed right-5 z-40 h-12 w-12 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 md:right-8"
        style={{
          background: 'var(--neu-surface)',
          border: '1px solid var(--neu-border)',
          color: 'var(--neu-accent-mid)',
        }}
      >
        <MessageCirclePlus className="h-5 w-5" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-end p-4 md:p-8"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          {/* Modal */}
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-base" style={{ color: 'var(--neu-text)' }}>Feedback senden</h2>
              <button
                onClick={handleClose}
                className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: 'var(--neu-accent-mid)' }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {success ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle className="h-10 w-10" style={{ color: '#22c55e' }} />
                <p className="font-medium" style={{ color: 'var(--neu-text)' }}>Danke für dein Feedback!</p>
                <p className="text-sm" style={{ color: 'var(--neu-text-secondary)' }}>Wird an den Admin weitergeleitet.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type Selector */}
                <div className="flex gap-2">
                  {TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all"
                      style={{
                        background: type === t.value ? 'var(--neu-bg)' : 'transparent',
                        border: `1px solid ${type === t.value ? t.color : 'var(--neu-border)'}`,
                        color: type === t.value ? t.color : 'var(--neu-text-secondary)',
                      }}
                    >
                      {t.icon}
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>
                    Titel
                  </label>
                  <input
                    ref={titleRef}
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder={
                      type === 'bug' ? 'z.B. Button reagiert nicht' :
                      type === 'feature' ? 'z.B. Export als PDF' :
                      'Kurze Zusammenfassung'
                    }
                    maxLength={120}
                    required
                    className="w-full text-sm"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>
                    Beschreibung
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder={
                      type === 'bug' ? 'Was ist passiert? Wie kann man es nachstellen?' :
                      type === 'feature' ? 'Was soll die Funktion können?' :
                      'Deine Nachricht...'
                    }
                    rows={4}
                    maxLength={1000}
                    required
                    className="w-full text-sm resize-none"
                    style={{ lineHeight: '1.5' }}
                  />
                </div>

                {/* Page URL hint */}
                <p className="text-xs" style={{ color: 'var(--neu-accent-mid)' }}>
                  Seite: <span style={{ color: 'var(--neu-text-secondary)' }}>{pathname}</span>
                </p>

                {error && (
                  <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={handleClose} className="neu-btn flex-1 py-2 text-sm">
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || !title.trim() || !description.trim()}
                    className="neu-btn-primary flex-1 py-2 text-sm disabled:opacity-40"
                  >
                    {isPending ? 'Senden…' : 'Senden'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
