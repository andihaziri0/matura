'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-provider';
import { Sq, type CreateQuestionInput } from '@matura/shared';

type Image = CreateQuestionInput['images'][number];

interface Props {
  images: Image[];
  onChange: (next: Image[]) => void;
}

export function ImageUploader({ images, onChange }: Props): JSX.Element {
  const { getIdToken } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File): Promise<void> {
    setError(null);
    setBusy(true);
    try {
      const token = await getIdToken();
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
      const presignRes = await fetch(`${apiBase}/api/media/presign-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          sizeBytes: file.size,
        }),
      });
      if (!presignRes.ok) {
        setError(Sq.sq.errors.unknown);
        return;
      }
      const presign = (await presignRes.json()) as {
        uploadUrl: string;
        r2Key: string;
        publicUrl: string;
      };

      const putRes = await fetch(presign.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!putRes.ok) {
        setError(Sq.sq.errors.unknown);
        return;
      }

      onChange([
        ...images,
        {
          r2Key: presign.r2Key,
          alt: file.name,
          order: images.length + 1,
          role: 'INLINE',
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <label className="cursor-pointer rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-[var(--color-bg-elevated)]">
          {busy ? Sq.sq.common.loading : Sq.sq.admin.questions.uploadImage}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
              e.target.value = '';
            }}
          />
        </label>
        {error && <span className="text-sm text-[var(--color-danger)]">{error}</span>}
      </div>
      {images.length > 0 && (
        <ul className="text-sm text-[var(--color-fg-muted)] space-y-1">
          {images.map((img, idx) => (
            <li key={`${img.r2Key}-${idx}`} className="flex items-center justify-between">
              <span className="truncate">{img.alt || img.r2Key}</span>
              <button
                type="button"
                className="hover:underline"
                onClick={() => onChange(images.filter((_, i) => i !== idx))}
              >
                {Sq.sq.common.delete}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
