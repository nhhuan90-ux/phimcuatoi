const axios = require('axios');

async function extractVidhide() {
  const url = 'https://morencius.com/v/q5rkfaev9in8';
  console.log('Fetching', url);
  try {
    const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = res.data;
    console.log('HTML length:', html.length);
    
    // Dump all eval blocks
    let m;
    const re = /eval\(function\(p,a,c,k,e,[\s\S]*?\.split\('\|'\).*?\)/g;
    while ((m = re.exec(html)) !== null) {
      console.log('Found eval block:', m[0].substring(0, 100));
      
      const pMatch = m[0].match(/}\s*\(\s*'((?:\\'|[^'])*)'\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*'([^']+)'/);
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
        
        console.log('Unpacked:', p.substring(0, 300));
        const m3u8Match = p.match(/(https?:\/\/[^"'\s|]+\.m3u8[^"'\s|]*)/i);
        if (m3u8Match) {
          console.log('M3U8 FOUND:', m3u8Match[1]);
        }
      }
    }
  } catch (err) { console.error('Err:', err.message); }
}
extractVidhide();
