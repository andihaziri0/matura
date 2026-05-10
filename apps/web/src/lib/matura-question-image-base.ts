/** Cache-bust query on image URLs after deploy (set in next.config from Vercel git SHA / deployment id). */
function mediaCacheQuery(): string {
  const v = process.env.NEXT_PUBLIC_MEDIA_CACHE_BUST?.trim() ?? '';
  return v.length > 0 ? `?v=${encodeURIComponent(v)}` : '';
}

/** Build `<img src>` URL for stored question assets (`QuestionImage.r2Key`). Uses CDN base when inlined; otherwise same-origin `/api/media/` relay. */
export function maturaQuestionImageHref(r2Key: string): string {
  const trimmed = r2Key.replace(/^\//, '');
  const q = mediaCacheQuery();
  const pub = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.trim() ?? '';
  if (pub.length > 0) return `${pub.replace(/\/$/, '')}/${trimmed}${q}`;
  const enc = trimmed.split('/').map((seg) => encodeURIComponent(seg)).join('/');
  return `/api/media/${enc}${q}`;
}
