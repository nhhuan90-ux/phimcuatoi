export async function onRequest(context) {
  const url = new URL(context.request.url);
  const catchall = context.params.catchall || [];
  const source = catchall[0] || '';
  const id = catchall.slice(1).join('/') || '';

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': '*'
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 1. JavTiful Clean Embed (Stripped of all ad scripts and popunders)
  if (source === 'javtiful') {
    try {
      const code = id.toUpperCase();
      const upstreamUrl = `https://upload18.org/play/index/${encodeURIComponent(code)}`;
      const res = await fetch(upstreamUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          'Referer': 'https://upload18.org/'
        }
      });

      if (!res.ok) {
        return new Response('Video not found or upstream error: ' + res.status, { status: res.status, headers: corsHeaders });
      }

      let html = await res.text();

      // Ensure base href points to upload18.org so all JWPlayer assets & stream load
      if (!html.includes('<base')) {
        html = html.replace('<head>', '<head><base href="https://upload18.org/">');
      }

      // Remove third-party ad scripts (popunders, vast, click redirects)
      html = html.replace(/<script[^>]*src=["'][^"']*(?:egotistic|driverhug|plywood|overblown|popunder|clocid)[^"']*["'][^>]*><\/script>/gi, '<!-- ad removed -->');
      html = html.replace(/<script[^>]*data-clocid[^>]*>[\s\S]*?<\/script>/gi, '<!-- ad removed -->');

      // Remove / neutralize sandbox-guard probe so it never triggers false alarm
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
      return new Response('Embed error: ' + err.message, { status: 502, headers: corsHeaders });
    }
  }

  // 2. JAVSub Clean Embed & Iframe Detection Bypass (Eliminates BLOCKED! screen)
  if (source === 'javsub') {
    try {
      let targetEmbedUrl = decodeURIComponent(id);
      if (!targetEmbedUrl.startsWith('http')) {
        targetEmbedUrl = `https://e.streamforester.name/videos/${encodeURIComponent(id)}/play`;
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
        return new Response('Embed fetch failed: ' + embedRes.status, { status: embedRes.status, headers: corsHeaders });
      }

      let html = await embedRes.text();

      // Bakes authorized domain so config fetch returns real streams
      html = html.replace(/"domain"\s*:\s*"[^"]*"/g, '"domain":"javsub.blog"');
      // Bypass the BLOCKED! check: force iw to true
      html = html.replace(/"iw"\s*:\s*false/g, '"iw":true');
      html = html.replace(/if\s*\(\s*!o\.iw\s*\)[^;]*;/g, '/* bypass blocked */');
      html = html.replace(/!t\.iw\s*&&\s*n\.currentTime\s*>\s*15/g, 'false');
      html = html.replace(/window\.top\s*!==\s*window\.self/g, 'false');
      html = html.replace(/window\.self\s*!==\s*window\.top/g, 'false');

      // Inject base tag
      if (!html.includes('<base')) {
        html = html.replace('<head>', `<head><base href="${embedOrigin}/">`);
      }

      // Disarm popups
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
      return new Response('JAVSub embed error: ' + err.message, { status: 502, headers: corsHeaders });
    }
  }

  return new Response('Unknown embed source: ' + source, { status: 404, headers: corsHeaders });
}
