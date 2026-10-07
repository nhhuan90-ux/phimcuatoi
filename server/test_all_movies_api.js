const axios = require('axios');

async function testAllMoviesApi() {
  console.log('=== TESTING ALL MOVIE & VIDEO ENDPOINTS ON LIVE VERCEL ===');

  const sources = [
    { source: 'javhdz', id: '4003' },
    { source: 'vlxx', id: '1' },
    { source: 'javsub', id: 'co-giao-cuc-ky-nghiem-khac-nhung-lai-khong-mac-quan-lot-roi-sau-do' },
    { source: 'javtiful', id: 'fc2-ppv-4966033' },
    { source: 'subjav', id: '36104' },
    { source: 'phimxyz', id: '1' }
  ];

  for (const s of sources) {
    console.log(`\n--- TESTING ${s.source.toUpperCase()} (ID: ${s.id}) ---`);

    // 1. Test /api/movie/:source/:id
    try {
      const url1 = `https://phimcuatoi.vercel.app/api/movie/${s.source}/${encodeURIComponent(s.id)}`;
      const res1 = await axios.get(url1, { timeout: 8000 });
      console.log(`  [MOVIE API] Status: ${res1.status}, Title: "${res1.data?.title?.slice(0, 40)}"`);
    } catch (e) {
      console.error(`  [MOVIE API FAIL] Status: ${e.response?.status || e.message}`);
    }

    // 2. Test /api/video/:source/:id
    try {
      const url2 = `https://phimcuatoi.vercel.app/api/video/${s.source}/${encodeURIComponent(s.id)}`;
      const res2 = await axios.get(url2, { timeout: 8000 });
      console.log(`  [VIDEO API] Status: ${res2.status}, Response: ${JSON.stringify(res2.data).slice(0, 150)}`);
    } catch (e) {
      console.error(`  [VIDEO API FAIL] Status: ${e.response?.status || e.message}, Data:`, e.response?.data);
    }
  }
}

testAllMoviesApi();
