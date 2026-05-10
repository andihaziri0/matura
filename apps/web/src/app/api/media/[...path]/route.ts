import { getPublicStorageOrigin } from '@/server/public-storage-origin';

/** Only relay keys under this prefix (matches `QuestionImage.r2Key` in seed). */
const ALLOW_PREFIX = 'questions/';

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path: segments } = await context.params;
  if (!segments?.length) {
    return new Response('Not found', { status: 404 });
  }

  let key: string;
  try {
    key = segments.map((s) => decodeURIComponent(s)).join('/');
  } catch {
    return new Response('Bad path', { status: 400 });
  }

  if (key.includes('..') || !key.startsWith(ALLOW_PREFIX)) {
    return new Response('Forbidden', { status: 403 });
  }

  const origin = getPublicStorageOrigin();
  if (!origin) {
    return new Response('Storage base URL not configured', { status: 503 });
  }

  const url = `${origin}/${key}`;
  const upstream = await fetch(url, {
    headers: { Accept: 'image/*,*/*;q=0.8' },
    next: { revalidate: 86_400 },
  });

  if (!upstream.ok) {
    const status = upstream.status;
    let detail = `Upstream HTTP ${status}`;
    if (status === 403 || status === 401) {
      detail +=
        ' — access denied (bucket private, or wrong public URL; check R2 public access / S3_PUBLIC_BASE_URL).';
    } else if (status === 404) {
      detail +=
        ' — object not at this URL (fix S3_PUBLIC_BASE_URL or upload PNG to this key in R2).';
    }
    return new Response(detail, { status: status === 404 ? 404 : 502 });
  }

  const body = upstream.body;
  if (!body) {
    return new Response('Empty', { status: 502 });
  }

  const ct = upstream.headers.get('content-type') ?? 'application/octet-stream';

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': ct,
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600',
    },
  });
}
