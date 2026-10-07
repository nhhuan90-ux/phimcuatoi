const axios = require('axios');

async function testPerfectHlsProxyParser() {
  console.log('=== TESTING PERFECT LINE-BY-LINE HLS PROXY PARSER ===\n');

  const testUrls = [
    { name: 'SubJAV', url: 'https://subjav1.blog/storage/m3u8/nu-giup-viec-nha-san-sang-nhan-ca-nhung-yeu-cau-lam-tinh-cua-ong-chu/index.m3u8', referer: 'https://subjav1.blog/' },
    { name: 'JAVHDz', url: 'https://p16-sg.tiktokcdn.top/ad-site-i18n-sg/ec8840e153d6ef49205e6506a6fb6f704003/javhd-4003-playlist.m3u8', referer: 'https://javhdz.cam/' }
  ];

  for (const t of testUrls) {
    console.log(`--- Testing ${t.name} ---`);
    try {
      const res = await axios.get(t.url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': t.referer } });
      const baseUrl = t.url.substring(0, t.url.lastIndexOf('/') + 1);

      const lines = res.data.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return line;

        let targetUrl = trimmed;
        if (!targetUrl.startsWith('http')) {
          targetUrl = baseUrl + targetUrl;
        }

        if (targetUrl.includes('.m3u8')) {
          return '/api/proxy/hls?url=' + encodeURIComponent(targetUrl);
        }
        return '/api/proxy/segment?url=' + encodeURIComponent(targetUrl);
      });

      const rewritten = lines.join('\n');
      console.log(`  Original length: ${res.data.length}, Rewritten length: ${rewritten.length}`);
      console.log('  Rewritten snippet:\n', rewritten.slice(0, 350));
    } catch (e) {
      console.error(`  ${t.name} FAIL:`, e.message);
    }
    console.log('\n');
  }
}

testPerfectHlsProxyParser();
