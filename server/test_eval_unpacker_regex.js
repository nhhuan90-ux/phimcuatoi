const axios = require('axios');

function unpackPackerString(str) {
  const match = str.match(/}\s*\(\s*'(.+)'\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*'(.+)'\.split\('\|'\)/s);
  if (!match) return null;
  let p = match[1];
  const a = parseInt(match[2]);
  const c = parseInt(match[3]);
  const k = match[4].split('|');

  const getSymbol = (num) => {
    return (num < a ? '' : getSymbol(Math.floor(num / a))) +
      ((num = num % a) > 35 ? String.fromCharCode(num + 29) : num.toString(36));
  };

  let dict = {};
  for (let i = 0; i < c; i++) {
    dict[getSymbol(i)] = k[i] || getSymbol(i);
  }

  return p.replace(/\b\w+\b/g, (w) => dict[w] || w);
}

async function testEvalUnpackerRegex() {
  const embedUrl = 'https://morencius.com/v/lqo4y9bjnmyo';
  const res = await axios.get(embedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });

  const evalMatch = res.data.match(/eval\(function\(p,a,c,k,e,d\).+?\)\)/s);
  if (evalMatch) {
    const unpacked = unpackPackerString(evalMatch[0]);
    console.log('Unpacked snippet:\n', unpacked?.slice(0, 400));
    const m3u8Match = unpacked?.match(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/i);
    console.log('  [SUCCESS UNPACKED M3U8]:', m3u8Match ? m3u8Match[1] : 'NONE');

    if (m3u8Match) {
      const m3u8Res = await axios.get(m3u8Match[1], {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://morencius.com/' }
      });
      console.log('  [SUCCESS M3U8 FETCH STATUS]:', m3u8Res.status, 'First line:', m3u8Res.data.split('\n')[0]);
    }
  }
}

testEvalUnpackerRegex();
