const axios = require('axios');
const fs = require('fs');

const domains = JSON.parse(fs.readFileSync('server/domains.json', 'utf-8'));

async function testFixedSegmentProxy() {
  console.log('=== TESTING FIXED SEGMENT PROXY LOGIC ===');

  const page = await axios.get(`https://${domains.javhdz}/vo-tinh-nhin-thay-chi-dau-thu-dam----satsuki-mei-4003.html`, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const match = page.data.match(/window\.atob\(["']([^"']+)["']\)/);
  const masterM3u8 = Buffer.from(match[1], 'base64').toString('utf-8');

  const masterRes = await axios.get(masterM3u8, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': `https://${domains.javhdz}/` }
  });
  const subPlaylistPath = masterRes.data.split('\n').find(l => l.includes('.m3u8'));
  const baseUrl = masterM3u8.substring(0, masterM3u8.lastIndexOf('/') + 1);
  const subPlaylistUrl = baseUrl + subPlaylistPath;

  const subRes = await axios.get(subPlaylistUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': `https://${domains.javhdz}/` }
  });
  const rawSegmentUrl = subRes.data.split('\n').find(l => l.includes('.ts') || l.includes('.png') || l.includes('http'));
  console.log('Raw Segment URL from m3u8:', rawSegmentUrl);

  // Apply fix: replace .ts with .png if needed
  let targetUrl = rawSegmentUrl.replace(/\.ts(\?|$)/, '.png$1');
  console.log('Target URL for proxy fetch:', targetUrl);

  try {
    const res = await axios.get(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Referer': `https://${domains.javhdz}/` },
      responseType: 'arraybuffer'
    });
    console.log('[SUCCESS] Segment fetch status:', res.status, 'Byte length:', res.data.length);
  } catch (e) {
    console.error('[FAIL] Segment fetch fail:', e.message);
  }
}

testFixedSegmentProxy();
