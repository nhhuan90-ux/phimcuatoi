const axios = require('axios');

async function findActiveJavhdzDomain() {
  const candidates = [
    'javhdz.cam',
    'javhdz.net',
    'javhdz.org',
    'javhdz.in',
    'javhdz.cc',
    'javhdz.club',
    'javhdz.me',
    'javhdz.tv',
    'javhdz.vip',
    'javhdz.life',
    'javhdz.fit',
    'javhdz.site'
  ];

  console.log('=== SEARCHING FOR ACTIVE JAVHDZ DOMAIN ===\n');

  for (const domain of candidates) {
    try {
      const res = await axios.get(`https://${domain}/`, {
        timeout: 5000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      console.log(`[FOUND LIVE] ${domain}: Status ${res.status}, Length ${res.data.length}`);
      if (res.data.includes('javhdz') || res.data.includes('phim')) {
        console.log(`  -> CONFIRMED ADULT MOVIE SITE: ${domain}!`);
      }
    } catch (e) {
      console.log(`[FAIL] ${domain}: ${e.message}`);
    }
  }
}

findActiveJavhdzDomain();
