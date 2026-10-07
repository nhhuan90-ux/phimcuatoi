const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function testHelvidContent() {
  const masterUrl = 'https://helvid.com/m/L3YvRkMyLVBQVi00OTY2MDMzL3Jib294cnh6bnIvcGxheWxpc3QubTN1OA?e=1787802271&s=MvB3_s2K4yO0-e2P-zXnTA';
  try {
    const res = await axios.get(masterUrl, {
      headers: { 'User-Agent': UA, 'Referer': 'https://upload18.org/' }
    });
    console.log('Helvid Master Playlist:\n', res.data);

    // If it has sub-playlist URL
    const lines = res.data.split('\n').filter(l => l && !l.startsWith('#'));
    if (lines.length > 0) {
      const subUrl = lines[0].startsWith('http') ? lines[0] : 'https://helvid.com' + lines[0];
      console.log('\nFetching Sub-playlist:', subUrl);
      const subRes = await axios.get(subUrl, {
        headers: { 'User-Agent': UA, 'Referer': 'https://upload18.org/' }
      });
      console.log('Sub-playlist Content (first 10 lines):\n', subRes.data.split('\n').slice(0, 10).join('\n'));
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testHelvidContent();
