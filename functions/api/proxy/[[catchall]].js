export async function onRequest(context) {
  const url = new URL(context.request.url);
  const targetUrl = url.searchParams.get('url');

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': '*'
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!targetUrl) {
    return new Response('Missing url parameter', { status: 400, headers: corsHeaders });
  }

  try {
    let referer = url.searchParams.get('referer');
    if (!referer) {
      if (targetUrl.includes('tiktokcdn.top')) {
        referer = 'https://javhdz.life/';
      } else if (targetUrl.includes('vcast') || targetUrl.includes('sdeli') || targetUrl.includes('streamforester')) {
        referer = 'https://vcast.name/';
      } else if (targetUrl.includes('gooqlevideo') || targetUrl.includes('vlstream') || targetUrl.includes('vlxx')) {
        referer = 'https://play.vlstream.net/';
      } else if (targetUrl.includes('subjav')) {
        referer = 'https://subjav.asia/';
      } else {
        referer = targetUrl;
      }
    }

    const upstream = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Referer': referer
      }
    });

    const contentType = upstream.headers.get('content-type') || '';
    const isM3u8 = contentType.includes('mpegurl') || targetUrl.includes('.m3u8') || targetUrl.includes('.vl');

    if (isM3u8) {
      const text = await upstream.text();
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
      const lines = text.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return line;
        let segUrl = trimmed;
        if (!segUrl.startsWith('http')) segUrl = baseUrl + segUrl;
        return `/api/proxy/hls?url=${encodeURIComponent(segUrl)}&referer=${encodeURIComponent(referer)}`;
      });

      return new Response(lines.join('\n'), {
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache'
        }
      });
    }

    // Binary segment (.ts, .mp4, audio)
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'Content-Type': contentType || 'video/MP2T',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400'
      }
    });
  } catch (err) {
    return new Response('Proxy error: ' + err.message, { status: 502, headers: corsHeaders });
  }
}
