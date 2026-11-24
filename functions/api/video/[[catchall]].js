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
      const proxyUrl = `/api/proxy/hls?url=${encodeURIComponent(directManifest)}&referer=${encodeURIComponent('https://play.vlstream.net/')}`;
      return new Response(JSON.stringify({ videoUrl: proxyUrl, type: 'hls' }), { headers: corsHeaders });
    }

    // 2. JavTiful (Direct clean embed route stripped of popunder ads)
    if (source === 'javtiful') {
      return new Response(JSON.stringify({ url: `/api/embed/javtiful/${id.toUpperCase()}`, type: 'iframe' }), { headers: corsHeaders });
    }

    // 3. JAVSub (Direct clean HLS stream via wogplayer API config)
    if (source === 'javsub') {
      let hash = id;
      if (!/^[a-f0-9]{20,}$/.test(hash)) {
        const jDomains = ['javsub.blog', 'javsub.xyz'];
        for (const jd of jDomains) {
          try {
            const pageRes = await fetch(`https://${jd}/phim-sex/${encodeURIComponent(id)}`, {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Referer': `https://${jd}/` }
            });
            if (pageRes.ok) {
              const html = await pageRes.text();
              const m = html.match(/\/videos\/([a-f0-9]+)\//);
              if (m) { hash = m[1]; break; }
            }
          } catch (e) {}
        }
      }

      if (/^[a-f0-9]{20,}$/.test(hash)) {
        try {
          const cfgRes = await fetch(`https://wogplayer.top/videos/${hash}/config?d=javsub.blog`, {
            method: 'POST',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Referer': 'https://javsub.blog/',
              'Origin': 'https://javsub.blog'
            }
          });
          if (cfgRes.ok) {
            const cfgData = await cfgRes.json();
            const m3u8 = cfgData.sources?.[0]?.file;
            if (m3u8) {
              const proxyUrl = `/api/proxy/hls?url=${encodeURIComponent(m3u8)}&referer=${encodeURIComponent('https://wogplayer.top/')}`;
              return new Response(JSON.stringify({ videoUrl: proxyUrl, type: 'hls' }), { headers: corsHeaders });
            }
          }
        } catch (e) {}
      }

      // Fallback to clean embed proxy
      return new Response(JSON.stringify({ url: `/api/embed/javsub/${encodeURIComponent(hash || id)}`, type: 'iframe' }), { headers: corsHeaders });
    }

    // 4. JAVHDz (Stream HLS decoded from javhdz.page atob)
    if (source === 'javhdz') {
      const jDomains = ['javhdz.page', 'javhdz.cam', 'javhdz.one', 'javhdz.life'];
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
                const proxyUrl = `/api/proxy/hls?url=${encodeURIComponent(stream)}&referer=${encodeURIComponent('https://javhdz.page/')}`;
                return new Response(JSON.stringify({ videoUrl: proxyUrl, type: 'hls' }), { headers: corsHeaders });
              }
            }
          }
        } catch (e) {}
      }
    }

    // 5. SubJAV (Direct HLS from subjav.baby ecyihz/v1/player)
    if (source === 'subjav') {
      try {
        const pRes = await fetch(`https://subjav.baby/wp-json/ecyihz/v1/player/?id=${encodeURIComponent(id)}&server=${encodeURIComponent(server)}`, {
          headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://subjav.baby/' }
        });
        if (pRes.ok) {
          const pData = await pRes.json();
          if (pData && pData.data) {
            const mMatch = pData.data.match(/file:\s*['"](https?:\/\/[^'"]+\.m3u8)['"]/i);
            if (mMatch) {
              const proxyUrl = `/api/proxy/hls?url=${encodeURIComponent(mMatch[1])}&referer=${encodeURIComponent('https://subjav.baby/')}`;
              return new Response(JSON.stringify({ videoUrl: proxyUrl, type: 'hls' }), { headers: corsHeaders });
            }
          }
        }
      } catch (e) {}
      return new Response(JSON.stringify({ url: `https://subjav.baby/player/${encodeURIComponent(id)}/`, type: 'iframe' }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: 'Nguồn không hỗ trợ: ' + source }), { status: 404, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 502, headers: corsHeaders });
  }
}
