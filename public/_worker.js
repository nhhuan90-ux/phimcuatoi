export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Handle API Video Resolver
    if (url.pathname.startsWith('/api/video/')) {
      const parts = url.pathname.replace('/api/video/', '').split('/');
      const source = parts[0];
      const id = parts.slice(1).join('/');
      const server = url.searchParams.get('server') || '1';
      const corsHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': '*'
      };

      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }

      // VLXX: Fetch player iframe from ajax.php
      if (source === 'vlxx') {
        try {
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
              const vm = playUrl.match(/\/videos\/([a-f0-9]+)\//);
              if (vm) {
                return new Response(JSON.stringify({ videoUrl: `https://vcast.name/videos/${vm[1]}/master.m3u8`, type: 'hls' }), { headers: corsHeaders });
              }
              return new Response(JSON.stringify({ url: playUrl, type: 'iframe' }), { headers: corsHeaders });
            }
          }
        } catch (e) {}
      }

      // SubJAV
      if (source === 'subjav') {
        const m3u8Url = `https://subjav1.blog/storage/m3u8/${encodeURIComponent(id)}/index.m3u8`;
        return new Response(JSON.stringify({ videoUrl: m3u8Url, type: 'hls' }), { headers: corsHeaders });
      }

      // JAVHDz
      if (source === 'javhdz') {
        const m3u8Url = `https://p16-sg.tiktokcdn.top/ad-site-i18n-sg/ec8840e153d6ef49205e6506a6fb6f704003/javhd-${encodeURIComponent(id)}-playlist.m3u8`;
        return new Response(JSON.stringify({ videoUrl: m3u8Url, type: 'hls' }), { headers: corsHeaders });
      }

      return new Response(JSON.stringify({ error: 'Unknown source: ' + source }), { status: 400, headers: corsHeaders });
    }

    // 2. Default: Serve static assets
    return env.ASSETS.fetch(request);
  }
};
