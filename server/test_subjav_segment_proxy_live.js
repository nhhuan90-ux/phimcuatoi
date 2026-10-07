const axios = require('axios');

async function testSubjavSegmentProxyLive() {
  console.log('=== TESTING SUBJAV IBYTEIMG SEGMENT PROXY ===');
  const segmentUrl = 'https://p16-oec-sg.ibyteimg.com/obj/tos-alisg-i-aphluv4xwc-sg/94aa846500d14380b4db10875e4fbf0c';

  try {
    const res = await axios.get(segmentUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://subjav1.blog/'
      },
      responseType: 'arraybuffer'
    });
    console.log('Segment status:', res.status, 'Byte length:', res.data.length);
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testSubjavSegmentProxyLive();
