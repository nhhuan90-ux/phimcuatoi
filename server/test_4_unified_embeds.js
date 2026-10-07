const axios = require('axios');
const fs = require('fs');

async function testUnifiedEmbeds() {
  console.log('=== TESTING UNIFIED EMBEDS ===');

  // Test JavTiful m3u8 extraction
  const embedUrl = 'https://upload18.org/play/index/FC2-PPV-4966033';
  const res = await axios.get(embedUrl, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://javtiful.fit/' } });
  const match = res.data.match(/"m3u8"\s*:\s*"([^"]+)"/);
  console.log('JavTiful native m3u8:', match ? match[1].slice(0, 80) : 'NONE');

  // Test JAVSub master m3u8
  const javsubUrl = 'https://e.streamforester.name/videos/690fadb2f3348391350e9f32/master.m3u8';
  try {
    const javsubRes = await axios.get(javsubUrl, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://javsub.blog/' } });
    console.log('JAVSub master.m3u8 status:', javsubRes.status, 'First line:', javsubRes.data.split('\n')[0]);
  } catch (e) { console.error('JAVSub master.m3u8 fail:', e.message); }
}

testUnifiedEmbeds();
