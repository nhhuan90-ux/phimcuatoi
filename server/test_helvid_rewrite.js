const axios = require('axios');

async function testHelvidRewrite() {
  const masterUrl = 'https://upload18.org/play/index/FC2-PPV-4966033';
  const embedRes = await axios.get(masterUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://javtiful.fit/' }
  });
  const match = embedRes.data.match(/"m3u8"\s*:\s*"([^"]+)"/);
  if (!match) return console.log('No m3u8');
  const m3u8Url = match[1].replace(/\\/g, '').replace(/u0026/g, '&');
  console.log('Master URL:', m3u8Url);

  const res = await axios.get(m3u8Url, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://upload18.org/' }
  });
  console.log('Raw Master Playlist:\n', res.data);

  // Correct URL rewrite for helvid lines:
  const lines = res.data.split('\n');
  const rewritten = lines.map(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return line;
    const absUrl = line.startsWith('http') ? line : new URL(line, m3u8Url).href;
    if (absUrl.includes('/s/')) {
      return '/api/proxy/hls?url=' + encodeURIComponent(absUrl);
    }
    return absUrl;
  }).join('\n');

  console.log('\nRewritten Master Playlist:\n', rewritten);
}

testHelvidRewrite();
