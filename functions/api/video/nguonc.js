export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const embed = url.searchParams.get('embed');
  if (!embed) {
    return new Response(JSON.stringify({ error: 'Missing embed URL' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const urlObj = new URL(embed);
    const origin = urlObj.origin;

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      'Referer': embed,
      'Origin': origin,
      'Content-Type': 'application/json'
    };

    // Step 1: Bootstrap
    const bRes = await fetch(embed, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'bootstrap',
        referrer: 'https://phimcuatoi.online/',
        frame_origins: ['https://phimcuatoi.online']
      })
    });

    if (!bRes.ok) throw new Error('Bootstrap failed: ' + bRes.status);
    const bData = await bRes.json();
    if (!bData.bootstrap) throw new Error('Missing bootstrap token');

    // Step 2: Issue direct HLS playlist
    const issueRes = await fetch(embed, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'issue',
        bootstrap: bData.bootstrap,
        turnstile_response: '',
        playlist_format: 'hls',
        pretty_url: true,
        path_chunks: true,
        frame_origins: ['https://phimcuatoi.online']
      })
    });

    if (!issueRes.ok) throw new Error('Issue failed: ' + issueRes.status);
    const issueData = await issueRes.json();
    const rawM3u8 = issueData.playlist;
    if (!rawM3u8) throw new Error('Missing playlist URL');

    const proxyUrl = `/api/proxy/hls?url=${encodeURIComponent(rawM3u8)}&referer=${encodeURIComponent(embed)}`;
    return Response.redirect(new URL(proxyUrl, context.request.url).href, 302);
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
