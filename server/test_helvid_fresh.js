const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function testHelvidFresh() {
  const u18Url = 'https://upload18.org/play/index/FC2-PPV-4966033';
  const u18Res = await axios.get(u18Url, {
    headers: { 'User-Agent': UA, 'Referer': 'https://javtiful.fit/' }
  });
  const match = u18Res.data.match(/"m3u8"\s*:\s*"([^"]+)"/);
  if (!match) return console.log('No m3u8 match');

  const m3u8Url = match[1].replace(/\\/g, '').replace(/u0026/g, '&');
  console.log('Fresh m3u8 URL:', m3u8Url);

  const res = await axios.get(m3u8Url, {
    headers: { 'User-Agent': UA, 'Referer': 'https://upload18.org/' }
  });
  console.log('Helvid Master Playlist:\n', res.data);

  const lines = res.data.split('\n').filter(l => l && !l.startsWith('#'));
  if (lines.length > 0) {
    const subUrl = lines[0].startsWith('http') ? lines[0] : (new URL(lines[0], m3u8Url)).href;
    console.log('Fetching Sub-playlist:', subUrl);
    const subRes = await axios.get(subUrl, {
      headers: { 'User-Agent': UA, 'Referer': 'https://upload18.org/' }
    });
    console.log('Sub-playlist Content:\n', subRes.data.split('\n').slice(0, 10).join('\n'));
  }
}

testHelvidFresh();
