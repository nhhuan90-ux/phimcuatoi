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
    let referer = 'https://streamc.xyz/';
    if (refererParam) {
      try {
        referer = new URL(refererParam).origin + '/';
      } catch (e) {
        referer = refererParam;
      }
    }

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      'Referer': referer
    };

    const upstream = await fetch(targetUrl, { headers });
    if (!upstream.ok) {
      return new Response('Segment fetch error ' + upstream.status, {
        status: upstream.status,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': 'video/MP2T',
        'Content-Length': upstream.headers.get('content-length') || '',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400'
      }
    });
  } catch (err) {
    return new Response('Segment proxy error: ' + err.message, {
      status: 502,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}
