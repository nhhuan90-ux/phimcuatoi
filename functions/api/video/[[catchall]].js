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
    // 1. VLXX (Direct HLS Stream via gooqlevideo)
    if (source === 'vlxx') {
      const paddedId = String(id).padStart(5, '0');
      const directManifest = `https://rr3---sn-8pxuuxa-i5ozr.gooqlevideo.com/manifest-s1/${paddedId}.vl`;
      const proxyUrl = `/api/proxy/hls?url=${encodeURIComponent(directManifest)}`;
      return new Response(JSON.stringify({ videoUrl: proxyUrl, type: 'hls' }), { headers: corsHeaders });
    }

    // 2. JavTiful (Direct clean embed)
    if (source === 'javtiful') {
      return new Response(JSON.stringify({ url: `https://upload18.org/play/index/${id.toUpperCase()}`, type: 'iframe' }), { headers: corsHeaders });
    }

    // 3. JAVSub (Direct clean HLS stream via vcast.name)
    if (source === 'javsub') {
      // If id is a slug or code, fetch page to extract hash
      const jDomains = ['javsub.blog', 'javsub.xyz'];
      for (const jd of jDomains) {
        try {
          const pageRes = await fetch(`https://${jd}/phim-sex/${encodeURIComponent(id)}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Referer': `https://${jd}/` }
          });
          if (pageRes.ok) {
            const html = await pageRes.text();
            const hashMatch = html.match(/\/videos\/([a-f0-9]+)\//);
            if (hashMatch) {
              const hlsUrl = `/api/proxy/hls?url=${encodeURIComponent(`https://vcast.name/videos/${hashMatch[1]}/master.m3u8`)}`;
              return new Response(JSON.stringify({ videoUrl: hlsUrl, type: 'hls' }), { headers: corsHeaders });
            }
          }
        } catch (e) {}
      }
      // Fallback if hash directly passed
      if (/^[a-f0-9]{20,}$/.test(id)) {
        const hlsUrl = `/api/proxy/hls?url=${encodeURIComponent(`https://vcast.name/videos/${id}/master.m3u8`)}`;
        return new Response(JSON.stringify({ videoUrl: hlsUrl, type: 'hls' }), { headers: corsHeaders });
      }
    }

    // 4. JAVHDz (Stream HLS decoded from javhdz.life atob)
    if (source === 'javhdz') {
      const jDomains = ['javhdz.life', 'javhdz.one'];
      for (const jd of jDomains) {
        try {
          const jRes = await fetch(`https://${jd}/-${encodeURIComponent(id)}.html`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Referer': `https://${jd}/`
            }
          });
          if (jRes.ok) {
            const jHtml = await jRes.text();
            const atobMatch = jHtml.match(/atob\(\s*["']([^"']+)["']\s*\)/);
            if (atobMatch) {
              const stream = atob(atobMatch[1]);
              if (stream && stream.startsWith('http')) {
                const proxyUrl = `/api/proxy/hls?url=${encodeURIComponent(stream)}`;
                return new Response(JSON.stringify({ videoUrl: proxyUrl, type: 'hls' }), { headers: corsHeaders });
              }
            }
          }
        } catch (e) {}
      }
    }

    // 5. SubJAV (Direct HLS from apistream)
    if (source === 'subjav') {
      try {
        const pRes = await fetch(`https://subjav.asia/wp-json/ecyihz/v1/player/?id=${encodeURIComponent(id)}&server=${encodeURIComponent(server)}`, {
          headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://subjav.asia/' }
        });
        if (pRes.ok) {
          const pData = await pRes.json();
          if (pData && pData.data) {
            const mMatch = pData.data.match(/file:\s*['"](https?:\/\/[^'"]+\.m3u8)['"]/i);
            if (mMatch) {
              return new Response(JSON.stringify({ videoUrl: mMatch[1], type: 'hls' }), { headers: corsHeaders });
            }
          }
        }
      } catch (e) {}
      return new Response(JSON.stringify({ url: `https://subjav.asia/player/${encodeURIComponent(id)}/`, type: 'iframe' }), { headers: corsHeaders });
    }

    // 6. PhimXYZ
    if (source === 'phimxyz') {
      return new Response(JSON.stringify({ error: 'Nguồn PhimXYZ hiện đang bảo trì máy chủ.' }), { status: 503, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: 'Unknown source: ' + source }), { status: 400, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 502, headers: corsHeaders });
  }
}
