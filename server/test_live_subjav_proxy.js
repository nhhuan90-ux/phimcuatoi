const axios = require('axios');

async function testLiveSubjavProxy() {
  console.log('=== TESTING LIVE SUBJAV PROXY ON VERCEL ===\n');

  const targetM3u8 = 'https://subjav1.blog/storage/m3u8/nu-giup-viec-nha-san-sang-nhan-ca-nhung-yeu-cau-lam-tinh-cua-ong-chu/index.m3u8';
  const proxyUrl = `https://phimcuatoi.vercel.app/api/proxy/hls?url=${encodeURIComponent(targetM3u8)}`;

  try {
    const res = await axios.get(proxyUrl, { timeout: 10000 });
    console.log('Proxy status:', res.status);
    console.log('Proxy content-type:', res.headers['content-type']);
    console.log('Proxy body snippet:\n', res.data);

    // If body contains sub-playlist m3u8, test fetching that sub-playlist!
    const lines = res.data.split('\n').filter((l) => l.trim() && !l.startsWith('#'));
    console.log('Sub-playlist URLs found:', lines);

    if (lines.length > 0) {
      const subUrl = lines[0].startsWith('http') ? lines[0] : `https://phimcuatoi.vercel.app${lines[0]}`;
      console.log(`\nFetching sub-playlist: ${subUrl}`);
      const subRes = await axios.get(subUrl, { timeout: 10000 });
      console.log('Sub-playlist status:', subRes.status);
      console.log('Sub-playlist body snippet:\n', subRes.data.slice(0, 400));
    }
  } catch (e) {
    console.error('FAIL:', e.message);
    if (e.response) {
      console.log('Response Status:', e.response.status, 'Data:', e.response.data);
    }
  }
}

testLiveSubjavProxy();
