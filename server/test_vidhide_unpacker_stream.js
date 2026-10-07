const axios = require('axios');

function unpackVidhideScript(html) {
  const evalMatch = html.match(/eval\(function\(p,a,c,k,e,d\).+?\)\)/s);
  if (!evalMatch) return null;
  const str = evalMatch[0];

  const match = str.match(/}\s*\(\s*'(.+)'\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*'(.+)'\.split\('\|'\)/s);
  if (!match) return null;
  let p = match[1];
  const a = parseInt(match[2]);
  let c = parseInt(match[3]);
  const k = match[4].split('|');

  while (c--) {
    if (k[c]) {
      p = p.replace(new RegExp('\\b' + c.toString(a) + '\\b', 'g'), k[c]);
    }
  }
  return p;
}

async function testVidhideUnpackerStream() {
  console.log('=== TESTING VIDHIDE UNPACKER STREAM ===');
  const url = 'https://morencius.com/v/q5rkfaev9in8';

  try {
    const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
    const unpacked = unpackVidhideScript(res.data);
    console.log('Unpacked code snippet:\n', unpacked ? unpacked.slice(0, 500) : 'NULL');

    const m3u8Match = unpacked ? unpacked.match(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/i) : null;
    console.log('Direct m3u8 stream URL:', m3u8Match ? m3u8Match[1] : 'NONE');

    if (m3u8Match) {
      const m3u8Res = await axios.get(m3u8Match[1], {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://morencius.com/' }
      });
      console.log('  [SUCCESS FETCH M3U8] Status:', m3u8Res.status, 'First line:', m3u8Res.data.split('\n')[0]);
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testVidhideUnpackerStream();
