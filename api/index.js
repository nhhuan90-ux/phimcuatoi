export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    // Match /api/video/:source/:id
    const match = pathname.match(/\/api\/video\/([^\/]+)\/([^\/?]+)/);
    if (!match) {
      return res.status(404).json({ error: 'Endpoint not found: ' + pathname });
    }

    const source = match[1];
    const id = match[2];
    const server = url.searchParams.get('server') || req.query?.server || '1';

    // 1. VLXX
    if (source === 'vlxx') {
      try {
        const response = await fetch('https://vlxx.phd/ajax.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': 'https://vlxx.phd/'
          },
          body: `vlxx_server=1&id=${encodeURIComponent(id)}&server=${encodeURIComponent(server)}`
        });
        const data = await response.json();
        if (data && data.player) {
          const m = data.player.match(/src=["']([^"']+)["']/i);
          if (m) {
            return res.status(200).json({ url: m[1], type: 'iframe' });
          }
        }
        return res.status(404).json({ error: 'Player not found in VLXX response' });
      } catch (e) {
        return res.status(502).json({ error: 'Failed to contact VLXX: ' + e.message });
      }
    }

    // 2. JavTiful
    if (source === 'javtiful') {
      return res.status(200).json({ url: `https://upload18.org/play/index/${id.toUpperCase()}`, type: 'iframe' });
    }

    // 3. JAVSub
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
              return res.status(200).json({ videoUrl: `https://vcast.name/videos/${vm[1]}/master.m3u8`, type: 'hls' });
            }
            return res.status(200).json({ url: playUrl, type: 'iframe' });
          }
        }
      } catch (e) {}
    }

    // 4. SubJAV
    if (source === 'subjav') {
      return res.status(200).json({ videoUrl: `https://subjav1.blog/storage/m3u8/${encodeURIComponent(id)}/index.m3u8`, type: 'hls' });
    }

    // 5. JAVHDz
    if (source === 'javhdz') {
      return res.status(200).json({ videoUrl: `https://p16-sg.tiktokcdn.top/ad-site-i18n-sg/ec8840e153d6ef49205e6506a6fb6f704003/javhd-${encodeURIComponent(id)}-playlist.m3u8`, type: 'hls' });
    }

    return res.status(400).json({ error: 'Unsupported source: ' + source });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
