export async function onRequest(context) {
  const url = new URL(context.request.url);
  const targetUrl = url.searchParams.get('url');
  if (!targetUrl) return new Response('Missing url', { status: 400 });

  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      'Referer': url.searchParams.get('referer') || targetUrl
    };

    const upstream = await fetch(targetUrl, { headers });
    const contentType = upstream.headers.get('content-type') || 'application/vnd.apple.mpegurl';

    if (contentType.includes('mpegurl') || targetUrl.includes('.m3u8')) {
      const text = await upstream.text();
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
      const lines = text.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return line;
        let segUrl = trimmed;
        if (!segUrl.startsWith('http')) segUrl = baseUrl + segUrl;
        return `/api/proxy/hls?url=${encodeURIComponent(segUrl)}`;
      });
      return new Response(lines.join('\n'), {
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    return new Response(upstream.body, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400'
      }
    });
  } catch (err) {
    return new Response('Proxy error: ' + err.message, { status: 502, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
