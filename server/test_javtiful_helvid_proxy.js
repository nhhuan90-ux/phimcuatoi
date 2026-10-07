const axios = require('axios');

async function testJavtifulHelvidProxy() {
  console.log('=== TESTING JAVTIFUL HELVID PROXY ===');
  const embedUrl = 'https://upload18.org/play/index/FC2-PPV-4966033';

  try {
    const res = await axios.get(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://javtiful.fit/'
      }
    });

    console.log('Upload18 status:', res.status, 'HTML length:', res.data.length);

    // Match m3u8 URL in upload18 HTML
    const match = res.data.match(/"m3u8"\s*:\s*"([^"]+)"/i) || res.data.match(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/i);
    if (match) {
      const rawM3u8Url = match[1].replace(/\\/g, '').replace(/u0026/g, '&');
      console.log('Raw m3u8 URL:', rawM3u8Url);

      // Test fetching m3u8 from helvid with Referer: https://upload18.org/
      try {
        const m3u8Res = await axios.get(rawM3u8Url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Referer': 'https://upload18.org/',
            'Origin': 'https://upload18.org'
          }
        });
        console.log('  [SUCCESS HELVID M3U8] Status:', m3u8Res.status, 'First line:', m3u8Res.data.split('\n')[0]);
      } catch (err) {
        console.error('  [FAIL HELVID M3U8]:', err.message);
      }
    } else {
      console.log('No m3u8 match in upload18 HTML');
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testJavtifulHelvidProxy();
