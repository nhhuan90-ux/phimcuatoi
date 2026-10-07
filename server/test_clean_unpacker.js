const axios = require('axios');

function unpackVidhide(html) {
  const evalMatch = html.match(/eval\(function\(p,a,c,k,e,d\).+?\)\)/s);
  if (!evalMatch) return null;

  try {
    const fnStr = evalMatch[0].replace(/^eval/, 'var unpacked = ');
    const code = new Function(fnStr + '; return unpacked;')();
    return code;
  } catch (e) {
    return null;
  }
}

async function testCleanUnpacker() {
  const embedUrl = 'https://morencius.com/v/lqo4y9bjnmyo';
  const res = await axios.get(embedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });

  const unpacked = unpackVidhide(res.data);
  console.log('Unpacked code snippet:\n', unpacked?.slice(0, 400));
  const m3u8Match = unpacked?.match(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/i);
  console.log('  [SUCCESS UNPACKED M3U8]:', m3u8Match ? m3u8Match[1] : 'NONE');

  if (m3u8Match) {
    const m3u8Res = await axios.get(m3u8Match[1], {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://morencius.com/' }
    });
    console.log('  [SUCCESS M3U8 FETCH STATUS]:', m3u8Res.status, 'First line:', m3u8Res.data.split('\n')[0]);
  }
}

testCleanUnpacker();
