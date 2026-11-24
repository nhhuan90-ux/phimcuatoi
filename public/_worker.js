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

    // 0. Handle Clean Embeds (JavTiful & JAVSub)
    if (url.pathname.startsWith('/api/embed/javtiful/')) {
      const code = url.pathname.replace('/api/embed/javtiful/', '').toUpperCase();
      try {
        const upstreamUrl = `https://upload18.org/play/index/${encodeURIComponent(code)}`;
        const res = await fetch(upstreamUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
            'Referer': 'https://upload18.org/'
          }
        });

        if (!res.ok) {
          return new Response('Video not found or upstream error: ' + res.status, { status: res.status });
        }

        let html = await res.text();

        // Ensure base href points to upload18.org so all JWPlayer assets & stream load
        if (!html.includes('<base')) {
          html = html.replace('<head>', '<head><base href="https://upload18.org/">');
        }

        // Remove third-party ad scripts (popunders, vast, click redirects)
        html = html.replace(/<script[^>]*src=["'][^"']*(?:egotistic|driverhug|plywood|overblown|popunder|clocid)[^"']*["'][^>]*><\/script>/gi, '<!-- ad removed -->');
        html = html.replace(/<script[^>]*data-clocid[^>]*>[\s\S]*?<\/script>/gi, '<!-- ad removed -->');

        // Neutralize sandbox-guard probe so it never triggers false alarm
        html = html.replace(/<script[^>]*sandbox-guard[^>]*><\/script>/gi, '<script>window.__u18SandboxGuard={version:"1.1.0",blocked:false,reason:"",iframeContext:false,probeStatus:"clear",probeReason:""};</script>');

        // Inject strict popup killer to block any dynamic window.open / 3rd-party redirects
        const antiAdScript = `
        <script>
          (function() {
            try {
              window.open = function() { console.log('[AdBlock] Blocked popup attempt'); return null; };
            } catch(e) {}
            try {
              window.__u18SandboxGuard = { version: "1.1.0", blocked: false, reason: "", iframeContext: false, probeStatus: "clear" };
            } catch(e) {}
            document.addEventListener('click', function(e) {
              var el = e.target;
              while (el && el !== document) {
                if (el.tagName === 'A') {
                  var href = el.getAttribute('href') || '';
                  if (href.startsWith('http') && !href.includes('upload18.org') && !href.includes('helvid.com')) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[AdBlock] Blocked ad link click:', href);
                    return false;
                  }
                  el.removeAttribute('target');
                }
                el = el.parentNode;
              }
            }, true);
          })();
        </script>
        `;

        html = html.replace('<head>', '<head>' + antiAdScript);

        return new Response(html, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600'
          }
        });
      } catch (err) {
        return new Response('Embed error: ' + err.message, { status: 502 });
      }
    }

    if (url.pathname.startsWith('/api/embed/javsub/')) {
      const idOrUrl = decodeURIComponent(url.pathname.replace('/api/embed/javsub/', ''));
      try {
        let targetEmbedUrl = idOrUrl;
        if (!targetEmbedUrl.startsWith('http')) {
          targetEmbedUrl = `https://e.streamforester.name/videos/${encodeURIComponent(idOrUrl)}/play`;
        }
        const cleanUrl = targetEmbedUrl.replace(/&amp;/g, '&').replace(/&adTag=[^&]*/g, '').replace(/\?adTag=[^&]*/g, '');
        let embedOrigin = 'https://e.streamforester.name';
        try { embedOrigin = new URL(cleanUrl).origin; } catch (e) {}

        const embedRes = await fetch(cleanUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
            'Referer': 'https://javsub.blog/'
          }
        });

        if (!embedRes.ok) {
          return new Response('Embed fetch failed: ' + embedRes.status, { status: embedRes.status });
        }

        let html = await embedRes.text();

        html = html.replace(/"domain"\s*:\s*"[^"]*"/g, '"domain":"javsub.blog"');
        html = html.replace(/"iw"\s*:\s*false/g, '"iw":true');
        html = html.replace(/if\s*\(\s*!o\.iw\s*\)[^;]*;/g, '/* bypass blocked */');
        html = html.replace(/!t\.iw\s*&&\s*n\.currentTime\s*>\s*15/g, 'false');
        html = html.replace(/window\.top\s*!==\s*window\.self/g, 'false');
        html = html.replace(/window\.self\s*!==\s*window\.top/g, 'false');

        if (!html.includes('<base')) {
          html = html.replace('<head>', `<head><base href="${embedOrigin}/">`);
        }

        const antiAdScript = `
        <script>
          (function() {
            try { window.open = function() { console.log('[AdBlock] Blocked popup'); return null; }; } catch(e) {}
          })();
        </script>
        `;
        html = html.replace('<head>', '<head>' + antiAdScript);

        return new Response(html, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600'
          }
        });
      } catch (err) {
        return new Response('JAVSub embed error: ' + err.message, { status: 502 });
      }
    }

    // 1. Handle HLS Proxy
    if (url.pathname.startsWith('/api/proxy/hls')) {
      const targetUrl = url.searchParams.get('url');
      if (!targetUrl) return new Response('Missing url', { status: 400 });

      try {
        let referer = url.searchParams.get('referer');
        if (!referer) {
          if (targetUrl.includes('tiktokcdn.top') || targetUrl.includes('javhdz')) {
            referer = 'https://javhdz.page/';
          } else if (targetUrl.includes('vcast') || targetUrl.includes('sdeli') || targetUrl.includes('streamforester') || targetUrl.includes('wogplayer') || targetUrl.includes('bk11cba')) {
            referer = 'https://wogplayer.top/';
          } else if (targetUrl.includes('gooqlevideo') || targetUrl.includes('vlstream') || targetUrl.includes('vlxx')) {
            referer = 'https://play.vlstream.net/';
          } else if (targetUrl.includes('subjav')) {
            referer = 'https://subjav.baby/';
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
            if (!segUrl.startsWith('http')) {
              if (segUrl.startsWith('/')) {
                try {
                  segUrl = new URL(targetUrl).origin + segUrl;
                } catch (e) {
                  segUrl = baseUrl + segUrl;
                }
              } else {
                segUrl = baseUrl + segUrl;
              }
            }
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

    // 2. Handle API Video Resolver
    if (url.pathname.startsWith('/api/video/')) {
      const parts = url.pathname.replace('/api/video/', '').split('/');
      const source = parts[0];
      const id = parts.slice(1).join('/');
      const server = url.searchParams.get('server') || '1';

      // 1. VLXX (Direct HLS Stream via gooqlevideo)
      if (source === 'vlxx') {
        const paddedId = String(id).padStart(5, '0');
        const directManifest = `https://rr3---sn-8pxuuxa-i5ozr.gooqlevideo.com/manifest-s1/${paddedId}.vl`;
        const proxyUrl = `/api/proxy/hls?url=${encodeURIComponent(directManifest)}&referer=${encodeURIComponent('https://play.vlstream.net/')}`;
        return new Response(JSON.stringify({ videoUrl: proxyUrl, type: 'hls' }), { headers: corsHeaders });
      }

      // 2. JavTiful (Clean embed stripped of ad popunders)
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
        return new Response(JSON.stringify({ url: `/api/embed/javsub/${encodeURIComponent(hash || id)}`, type: 'iframe' }), { headers: corsHeaders });
      }

      // 4. SubJAV (Direct HLS from subjav.baby)
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

      // 5. JAVHDz (Stream HLS decoded from javhdz.page atob)
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

      return new Response(JSON.stringify({ error: 'Nguồn không hỗ trợ: ' + source }), { status: 404, headers: corsHeaders });
    }

    // 3. Default: Serve static assets
    return env.ASSETS.fetch(request);
  }
};
