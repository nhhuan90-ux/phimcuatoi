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

    // 0. Handle Clean Embed (JavTiful - stripped of ads and popunders)
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

    // 1. Handle HLS Proxy
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
        const proxyUrl = `/api/proxy/hls?url=${encodeURIComponent(directManifest)}`;
        return new Response(JSON.stringify({ videoUrl: proxyUrl, type: 'hls' }), { headers: corsHeaders });
      }

      // 2. JavTiful (Clean embed stripped of ad popunders)
      if (source === 'javtiful') {
        return new Response(JSON.stringify({ url: `/api/embed/javtiful/${id.toUpperCase()}`, type: 'iframe' }), { headers: corsHeaders });
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

    // 3. Default: Serve static assets
    return env.ASSETS.fetch(request);
  }
};
