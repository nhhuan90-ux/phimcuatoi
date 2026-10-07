const axios = require('axios');

async function testProxySegmentLive() {
  console.log('=== TESTING TS SEGMENT PROXY FOR JAVHDZ ON LIVE VERCEL ===');
  const segmentUrl = 'https://sf19-ads-format-sign.tiktokcdn.com/obj/ad-site-i18n/3cbdf558_3256_4d79_93e6_f4d765de09ea.ts';
  const proxyUrl = `https://phimcuatoi.vercel.app/api/proxy/segment?url=${encodeURIComponent(segmentUrl)}`;

  try {
    const res = await axios.get(proxyUrl, { timeout: 10000, responseType: 'arraybuffer' });
    console.log('TS Segment Proxy Status:', res.status);
    console.log('TS Segment Content-Type:', res.headers['content-type']);
    console.log('TS Segment Byte Length:', res.data.length);
  } catch (e) {
    console.error('TS Segment Proxy FAIL:', e.message);
    if (e.response) {
      console.log('Response Status:', e.response.status);
    }
  }
}

testProxySegmentLive();
