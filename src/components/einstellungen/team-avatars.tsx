'use client';

import { useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { Camera, Trash2, Loader2 } from 'lucide-react';
import { uploadAvatar, removeAvatar } from '@/lib/actions/profiles';

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  avatar_url: string | null;
}

function AvatarCard({ profile }: { profile: Profile }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [localUrl, setLocalUrl] = useState<string | null>(profile.avatar_url);
  const [error, setError] = useState<string | null>(null);

  const initials = (profile.full_name ?? profile.email)
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview immediately
    const preview = URL.createObjectURL(file);
    setLocalUrl(preview);
    setError(null);

    const formData = new FormData();
    formData.append('avatar', file);

    startTransition(async () => {
      const result = await uploadAvatar(profile.id, formData);
      if (result.error) {
        setError(result.error);
        setLocalUrl(profile.avatar_url);
      } else if (result.url) {
        setLocalUrl(result.url);
      }
    });

    // Reset input so same file can be re-selected
    e.target.value = '';
  }

  function handleRemove() {
    setLocalUrl(null);
    setError(null);
    startTransition(async () => {
      const result = await removeAvatar(profile.id);
      if (result.error) {
        setError(result.error);
        setLocalUrl(profile.avatar_url);
      }
    });
  }

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl" style={{ border: '1px solid var(--neu-border-subtle)', background: 'var(--neu-bg)' }}>
      {/* Avatar */}
      <div className="relative shrink-0">
        <div
          className="h-14 w-14 rounded-full overflow-hidden flex items-center justify-center text-lg font-bold"
          style={{ background: 'var(--neu-surface)', color: 'var(--neu-accent)', border: '2px solid var(--neu-border)' }}
        >
          {localUrl ? (
            <Image
              src={localUrl}
              alt={profile.full_name ?? profile.email}
              width={56}
              height={56}
              className="object-cover w-full h-full"
              unoptimized
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        {/* Upload-Overlay */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={isPending}
          className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
          style={{ background: 'var(--neu-accent)', border: '2px solid var(--neu-bg)' }}
          title="Foto hochladen"
        >
          {isPending
            ? <Loader2 className="h-3 w-3 animate-spin" style={{ color: '#fff' }} />
            : <Camera className="h-3 w-3" style={{ color: '#fff' }} />
          }
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--neu-text)' }}>
          {profile.full_name ?? '—'}
        </p>
        <p className="text-xs truncate" style={{ color: 'var(--neu-text-secondary)' }}>
          {profile.email}
        </p>
        <span
          className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full"
          style={{
            background: profile.role === 'admin' ? 'rgba(139,92,246,0.15)' : 'rgba(16,185,129,0.12)',
            color: profile.role === 'admin' ? '#8b5cf6' : '#10b981',
          }}
        >
          {profile.role === 'admin' ? 'Admin' : 'Mitarbeiter'}
        </span>
        {error && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{error}</p>}
      </div>

      {/* Remove avatar */}
      {localUrl && (
        <button
          type="button"
          onClick={handleRemove}
          disabled={isPending}
          className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg transition-opacity hover:opacity-70 disabled:opacity-40"
          title="Foto entfernen"
          style={{ color: 'var(--neu-accent-mid)' }}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

interface Props {
  profiles: Profile[];
}

export function TeamAvatars({ profiles }: Props) {
  return (
    <div className="space-y-3">
      {profiles.map(p => (
        <AvatarCard key={p.id} profile={p} />
      ))}
    </div>
  );
}
