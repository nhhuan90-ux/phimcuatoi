export async function onRequest(context) {
  const url = new URL(context.request.url);
  const catchall = context.params.catchall || [];
  const source = catchall[0] || '';
  const id = catchall.slice(1).join('/') || '';
  const server = url.searchParams.get('server') || '1';

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*'
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. VLXX
    if (source === 'vlxx') {
      const res = await fetch('https://vlxx.phd/ajax.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': 'https://vlxx.phd/'
        },
        body: `vlxx_server=1&id=${encodeURIComponent(id)}&server=${encodeURIComponent(server)}`
      });
      const data = await res.json();
      if (data && data.player) {
        const match = data.player.match(/src=["']([^"']+)["']/i);
        if (match) {
          return new Response(JSON.stringify({ url: match[1], type: 'iframe' }), { headers: corsHeaders });
        }
      }
      return new Response(JSON.stringify({ error: 'Player not found in VLXX response' }), { status: 404, headers: corsHeaders });
    }

    // 2. JavTiful
    if (source === 'javtiful') {
      const upperId = id.toUpperCase();
      return new Response(JSON.stringify({ url: `https://upload18.org/play/index/${upperId}`, type: 'iframe' }), { headers: corsHeaders });
    }

    // 3. JAVSub
    if (source === 'javsub') {
      const pageRes = await fetch(`https://javsub.xyz/phim-sex/${encodeURIComponent(id)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://javsub.xyz/'
        }
      });
      if (pageRes.ok) {
        const html = await pageRes.text();
        const srcMatch = html.match(/data-source="([^"]+)"/);
        if (srcMatch) {
          const playUrl = srcMatch[1].replace(/&adTag=[^&]*/g, '');
          const vm = playUrl.match(/\/videos\/([a-f0-9]+)\//);
          if (vm) {
            return new Response(JSON.stringify({ videoUrl: `https://vcast.name/videos/${vm[1]}/master.m3u8`, type: 'hls' }), { headers: corsHeaders });
          }
          return new Response(JSON.stringify({ url: playUrl, type: 'iframe' }), { headers: corsHeaders });
        }
      }
    }

    // 4. PhimXYZ
    if (source === 'phimxyz') {
      const pageRes = await fetch(`https://i1.phimxyz.blog/phim/${encodeURIComponent(id)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://i1.phimxyz.blog/' }
      });
      if (pageRes.ok) {
        const html = await pageRes.text();
        const m = html.match(/data-link=["']([^"']+)["']/);
        if (m) {
          let p = m[1];
          if (!p.startsWith('http')) p = 'https://i1.phimxyz.blog' + p;
          return new Response(JSON.stringify({ videoUrl: p, type: 'hls' }), { headers: corsHeaders });
        }
      }
    }

    // 5. SubJAV
    if (source === 'subjav') {
      const m3u8Url = `https://subjav1.blog/storage/m3u8/${encodeURIComponent(id)}/index.m3u8`;
      return new Response(JSON.stringify({ videoUrl: m3u8Url, type: 'hls' }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: 'Source not supported: ' + source }), { status: 400, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 502, headers: corsHeaders });
  }
}
