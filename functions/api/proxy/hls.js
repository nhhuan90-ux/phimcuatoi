export async function onRequestGet(context) {
  const reqUrl = new URL(context.request.url);
  const targetUrl = reqUrl.searchParams.get('url');
  const refererParam = reqUrl.searchParams.get('referer') || '';

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: 'Missing url' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    let referer = refererParam || 'https://streamc.xyz/';
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      'Referer': referer
    };

    const upstream = await fetch(targetUrl, { headers });
    if (!upstream.ok) {
      return new Response('Upstream HLS error ' + upstream.status, {
        status: 502,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    const playlistText = await upstream.text();
    const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
    const refQuery = refererParam ? '&referer=' + encodeURIComponent(refererParam) : '';

    const lines = playlistText.split('\n').map(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return line;
      let segUrl = trimmed;
      if (!segUrl.startsWith('http')) {
        segUrl = baseUrl + segUrl;
      }
      if (segUrl.includes('.m3u8')) {
        return `/api/proxy/hls?url=${encodeURIComponent(segUrl)}${refQuery}`;
      }
      return `/api/proxy/segment?url=${encodeURIComponent(segUrl)}${refQuery}`;
    });

    return new Response(lines.join('\n'), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60'
      }
    });
  } catch (err) {
    return new Response('HLS proxy error: ' + err.message, {
      status: 502,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}
