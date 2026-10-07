const axios = require('axios');
const fs = require('fs');

const domains = JSON.parse(fs.readFileSync('server/domains.json', 'utf-8'));

async function testSignedTsSegment() {
  console.log('=== TESTING SIGNED TS SEGMENT WITH PROPER REFERER ===');

  // 1. Get playlist from javhdz.cam
  const page = await axios.get(`https://${domains.javhdz}/vo-tinh-nhin-thay-chi-dau-thu-dam----satsuki-mei-4003.html`, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const match = page.data.match(/window\.atob\(["']([^"']+)["']\)/);
  const masterM3u8 = Buffer.from(match[1], 'base64').toString('utf-8');
  console.log('Master m3u8:', masterM3u8);

  // 2. Fetch master m3u8
  const masterRes = await axios.get(masterM3u8, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': `https://${domains.javhdz}/` }
  });
  const subPlaylistPath = masterRes.data.split('\n').find(l => l.includes('.m3u8'));
  const baseUrl = masterM3u8.substring(0, masterM3u8.lastIndexOf('/') + 1);
  const subPlaylistUrl = baseUrl + subPlaylistPath;
  console.log('Sub playlist URL:', subPlaylistUrl);

  // 3. Fetch sub playlist
  const subRes = await axios.get(subPlaylistUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': `https://${domains.javhdz}/` }
  });
  const tsSegmentUrl = subRes.data.split('\n').find(l => l.includes('.ts') || l.includes('http'));
  console.log('Fresh TS segment URL:', tsSegmentUrl);

  // 4. Fetch fresh TS segment with Referer
  try {
    const tsRes = await axios.get(tsSegmentUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': `https://${domains.javhdz}/` },
      responseType: 'arraybuffer'
    });
    console.log('[SUCCESS] Fresh TS segment status:', tsRes.status, 'Length:', tsRes.data.length);
  } catch (e) {
    console.error('[FAIL] Fresh TS segment error:', e.message);
  }
}

testSignedTsSegment();
