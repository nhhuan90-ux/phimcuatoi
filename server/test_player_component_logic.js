const axios = require('axios');

async function testPlayerComponentLogic() {
  console.log('=== TESTING DIRECT API RESPONSES FOR REACT PLAYER ===');
  const testCases = [
    { source: 'javhdz', id: '4003' },
    { source: 'javtiful', id: 'fc2-ppv-4966033' },
    { source: 'javsub', id: 'co-giao-cuc-ky-nghiem-khac-nhung-lai-khong-mac-quan-lot-roi-sau-do' },
    { source: 'subjav', id: '36019' }
  ];

  for (const tc of testCases) {
    console.log(`\nTesting ${tc.source.toUpperCase()} (ID: ${tc.id})`);
    try {
      const movieRes = await axios.get(`https://phimcuatoi.vercel.app/api/movie/${tc.source}/${tc.id}`);
      console.log('  Movie Title:', movieRes.data.title);

      const videoRes = await axios.get(`https://phimcuatoi.vercel.app/api/video/${tc.source}/${tc.id}`);
      console.log('  Video Payload:', videoRes.data);
    } catch (e) {
      console.error('  Error:', e.message);
    }
  }
}

testPlayerComponentLogic();
