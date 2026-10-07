const axios = require('axios');
const cheerio = require('cheerio');

async function extractVidhideM3u8() {
  const url = 'https://morencius.com/v/q5rkfaev9in8';
  try {
    const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = res.data;
    
    // Look for m3u8 link directly in the eval script
    const match = html.match(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/i);
    if (match) {
      console.log('Found m3u8 directly:', match[1]);
      return;
    }

    // Unpack eval
    const evalMatch = html.match(/eval\(function\(p,a,c,k,e,[\s\S]*?\.split\('\|'\)\)\)/);
    if (evalMatch) {
      const script = evalMatch[0];
      const pMatch = script.match(/}\s*\(\s*'([^']+)'\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*'([^']+)'/);
      if (pMatch) {
        let p = pMatch[1];
        const a = parseInt(pMatch[2]);
        let c = parseInt(pMatch[3]);
        const k = pMatch[4].split('|');

        while (c--) {
          if (k[c]) {
            p = p.replace(new RegExp('\\b' + c.toString(a) + '\\b', 'g'), k[c]);
          }
        }
        
        console.log('Unpacked script:\n', p.slice(0, 500));
        
        const m3u8Match = p.match(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/i) || p.match(/"([^"]+\.m3u8[^"]*)"/i);
        console.log('Found m3u8 in unpacked:', m3u8Match ? m3u8Match[1] : 'NONE');
      }
    } else {
      console.log('No eval script found');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}
extractVidhideM3u8();
