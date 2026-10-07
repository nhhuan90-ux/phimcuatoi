const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function testJavsubProxyEmbed(id) {
  console.log(`=== TESTING JAVSUB PROXY EMBED FOR ID: ${id} ===`);
  const targetUrl = `https://e.streamforester.name/videos/${id}/play?event_id=player-wrapper`;
  try {
    const res = await axios.get(targetUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': UA,
        'Referer': 'https://javsub.blog/'
      }
    });
    let html = res.data;
    console.log('Original HTML status:', res.status, 'Length:', html.length);

    // Bypass the "BLOCKED!" check by replacing `if(!o.iw)` with `if(false)`
    html = html.replace('if(!o.iw)return document.title="BLOCKED!"', 'if(false)return document.title="BLOCKED!"');
    html = html.replace('if(!o.iw)', 'if(false)');

    // Also inject <base href="https://e.streamforester.name/"> so relative scripts/styles load properly
    html = html.replace('<head>', '<head><base href="https://e.streamforester.name/">');

    console.log('Modified HTML length:', html.length);
    console.log('Contains BLOCKED bypass:', !html.includes('if(!o.iw)return document.title="BLOCKED!"'));
  } catch (e) {
    console.error('Fetch error:', e.message);
  }
}

testJavsubProxyEmbed('690854634daac3b7ce088f72');
