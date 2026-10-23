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
          if (targetUrl.includes('tiktokcdn.top')) referer = 'https://javhdz.one/';
          else if (targetUrl.includes('subjav')) referer = 'https://subjav.asia/';
          else if (targetUrl.includes('vcast') || targetUrl.includes('streamforester')) referer = 'https://javsub.xyz/';
          else referer = targetUrl;
        }

        const upstream = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
            'Referer': referer
          }
        });

        const contentType = upstream.headers.get('content-type') || 'application/vnd.apple.mpegurl';

        if (contentType.includes('mpegurl') || targetUrl.includes('.m3u8')) {
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

    // 1. Handle API Video Resolver
    if (url.pathname.startsWith('/api/video/')) {
      const parts = url.pathname.replace('/api/video/', '').split('/');
      const source = parts[0];
      const id = parts.slice(1).join('/');
      const server = url.searchParams.get('server') || '1';

      // VLXX
      if (source === 'vlxx') {
        try {
          const res = await fetch('https://vlxx.phd/ajax.php', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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
          return new Response(JSON.stringify({ error: 'Player not found in VLXX' }), { status: 404, headers: corsHeaders });
        } catch (e) {
          return new Response(JSON.stringify({ error: e.message }), { status: 502, headers: corsHeaders });
        }
      }

      // JavTiful
      if (source === 'javtiful') {
        return new Response(JSON.stringify({ url: `https://upload18.org/play/index/${id.toUpperCase()}`, type: 'iframe' }), { headers: corsHeaders });
      }

      // JAVSub
      if (source === 'javsub') {
        try {
          const pageRes = await fetch(`https://javsub.xyz/phim-sex/${encodeURIComponent(id)}`, {
            headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://javsub.xyz/' }
          });
          if (pageRes.ok) {
            const html = await pageRes.text();
            const srcMatch = html.match(/data-source="([^"]+)"/);
            if (srcMatch) {
              const playUrl = srcMatch[1].replace(/&adTag=[^&]*/g, '');
              return new Response(JSON.stringify({ url: playUrl, type: 'iframe' }), { headers: corsHeaders });
            }
          }
        } catch (e) {}
      }

      // SubJAV
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

      // JAVHDz
      if (source === 'javhdz') {
        try {
          const jRes = await fetch(`https://javhdz.one/-${encodeURIComponent(id)}.html`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Referer': 'https://javhdz.one/'
            }
          });
          if (jRes.ok) {
            const jHtml = await jRes.text();
            const atobMatch = jHtml.match(/atob\(\s*["']([^"']+)["']\s*\)/);
            if (atobMatch) {
              const stream = atob(atobMatch[1]);
              if (stream && stream.startsWith('http')) {
                return new Response(JSON.stringify({ videoUrl: stream, type: 'hls' }), { headers: corsHeaders });
              }
            }
          }
        } catch (e) {}
        return new Response(JSON.stringify({ url: `https://javhdz.one/-${encodeURIComponent(id)}.html`, type: 'iframe' }), { headers: corsHeaders });
      }

      // PhimXYZ
      if (source === 'phimxyz') {
        return new Response(JSON.stringify({ url: `https://phimxyz.xyz/phim/${encodeURIComponent(id)}`, type: 'iframe' }), { headers: corsHeaders });
      }

      return new Response(JSON.stringify({ error: 'Unknown source: ' + source }), { status: 400, headers: corsHeaders });
    }

    // 2. Default: Serve static assets
    return env.ASSETS.fetch(request);
  }
};
