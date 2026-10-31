export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 0. Handle HLS Proxy
    if (url.pathname.startsWith('/api/proxy/hls')) {
      const targetUrl = url.searchParams.get('url');
      if (!targetUrl) return new Response('Missing url', { status: 400 });

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

        return new Response(upstream.body, {
          status: upstream.status,
          headers: {
            'Content-Type': contentType || 'video/MP2T',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=86400'
          }
        });
      } catch (err) {
        return new Response('Proxy error: ' + err.message, { status: 502, headers: { 'Access-Control-Allow-Origin': '*' } });
      }
    }

    // 1. Handle API Video Resolver
    if (url.pathname.startsWith('/api/video/')) {
      const parts = url.pathname.replace('/api/video/', '').split('/');
      const source = parts[0];
      const id = parts.slice(1).join('/');
      const server = url.searchParams.get('server') || '1';

      // 1. VLXX (Direct HLS Stream via gooqlevideo)
      if (source === 'vlxx') {
        const paddedId = String(id).padStart(5, '0');
        const directManifest = `https://rr3---sn-8pxuuxa-i5ozr.gooqlevideo.com/manifest-s1/${paddedId}.vl`;
        const proxyUrl = `/api/proxy/hls?url=${encodeURIComponent(directManifest)}`;
        return new Response(JSON.stringify({ videoUrl: proxyUrl, type: 'hls' }), { headers: corsHeaders });
      }

      // 2. JavTiful (Upload18 direct embed)
      if (source === 'javtiful') {
        return new Response(JSON.stringify({ url: `https://upload18.org/play/index/${id.toUpperCase()}`, type: 'iframe' }), { headers: corsHeaders });
      }

      // 3. JAVSub (Direct clean HLS stream via vcast.name)
      if (source === 'javsub') {
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
        if (/^[a-f0-9]{20,}$/.test(id)) {
          const hlsUrl = `/api/proxy/hls?url=${encodeURIComponent(`https://vcast.name/videos/${id}/master.m3u8`)}`;
          return new Response(JSON.stringify({ videoUrl: hlsUrl, type: 'hls' }), { headers: corsHeaders });
        }
      }

      // 4. SubJAV (Direct HLS from ecyihz/apistream)
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

      // 5. JAVHDz (Stream HLS from javhdz.life atob)
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

      // 6. PhimXYZ
      if (source === 'phimxyz') {
        return new Response(JSON.stringify({ error: 'Nguồn PhimXYZ hiện đang bảo trì máy chủ.' }), { status: 503, headers: corsHeaders });
      }

      return new Response(JSON.stringify({ error: 'Unknown source: ' + source }), { status: 400, headers: corsHeaders });
    }

    // 2. Default: Serve static assets
    return env.ASSETS.fetch(request);
  }
};
