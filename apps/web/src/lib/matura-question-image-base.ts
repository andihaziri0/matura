/** Build `<img src>` URL for stored question assets (`QuestionImage.r2Key`). Uses CDN base when inlined; otherwise same-origin `/api/media/` relay. */
export function maturaQuestionImageHref(r2Key: string): string {
  const trimmed = r2Key.replace(/^\//, '');
  const pub = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.trim() ?? '';
  if (pub.length > 0) return `${pub.replace(/\/$/, '')}/${trimmed}`;
  const enc = trimmed.split('/').map((seg) => encodeURIComponent(seg)).join('/');
  return `/api/media/${enc}`;
}
