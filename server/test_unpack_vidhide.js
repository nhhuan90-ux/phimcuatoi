const axios = require('axios');

function unpackPacker(code) {
  try {
    const match = code.match(/}\s*\(\s*'(.+)'\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*'(.+)'\.split\('\|'\)/);
    if (!match) return null;
    let payload = match[1];
    const radix = parseInt(match[2]);
    let count = parseInt(match[3]);
    const symtab = match[4].split('|');

    while (count--) {
      if (symtab[count]) {
        payload = payload.replace(new RegExp('\\b' + count.toString(radix) + '\\b', 'g'), symtab[count]);
      }
    }
    return payload;
  } catch (e) {
    return null;
  }
}

async function testUnpackVidhide() {
  console.log('=== TESTING VIDHIDE UNPACKER FOR JAVHDZ ===');
  const embedUrl = 'https://morencius.com/v/lqo4y9bjnmyo';

  try {
    const res = await axios.get(embedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    const evalMatch = res.data.match(/eval\(function\(p,a,c,k,e,d\).+?\)\)/s);
    if (evalMatch) {
      console.log('Found eval packer script!');
      const unpacked = unpackPacker(evalMatch[0]);
      if (unpacked) {
        console.log('  Unpacked snippet:\n', unpacked.slice(0, 400));
        const m3u8Match = unpacked.match(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/i);
        console.log('  [SUCCESS UNPACKED M3U8]:', m3u8Match ? m3u8Match[1] : 'NONE');

        if (m3u8Match) {
          const m3u8Res = await axios.get(m3u8Match[1], {
            headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://morencius.com/' }
          });
          console.log('  [SUCCESS STREAM M3U8 STATUS]:', m3u8Res.status, 'First line:', m3u8Res.data.split('\n')[0]);
        }
      }
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testUnpackVidhide();
