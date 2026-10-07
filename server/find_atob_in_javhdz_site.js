const axios = require('axios');

async function findAtobInJavhdzSite() {
  const url = 'https://javhdz.site/vo-tinh-nhin-thay-chi-dau-thu-dam----satsuki-mei-4003.html';
  console.log('=== FINDING ATOB IN JAVHDZ.SITE ===');

  try {
    const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });

    const matches = res.data.match(/atob\(["']([^"']+)["']\)/gi) || res.data.match(/base64[^"'\s]+/gi);
    console.log('Base64 matches count:', matches ? matches.length : 0);
    if (matches) {
      console.log('Matches sample:', matches.slice(0, 5));
      for (const m of matches) {
        const b64 = m.replace(/^atob\(["']/, '').replace(/["']\)$/, '');
        try {
          const decoded = Buffer.from(b64, 'base64').toString('utf-8');
          if (decoded.includes('http')) {
            console.log('  [FOUND STREAM DECODED]:', decoded);
          }
        } catch (e) {}
      }
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

findAtobInJavhdzSite();
