const axios = require('axios');

async function testAllEmbedRoutes() {
  console.log('=== TESTING API EMBED PROXY ENDPOINTS ===');
  const testEmbeds = [
    { name: 'JAVHDz', url: 'http://localhost:3000/api/embed/javhdz/4003' },
    { name: 'JavTiful', url: 'http://localhost:3000/api/embed/javtiful/FC2-PPV-4966033' },
    { name: 'JAVSub', url: 'http://localhost:3000/api/embed/javsub/co-giao-cuc-ky-nghiem-khac-nhung-lai-khong-mac-quan-lot-roi-sau-do' },
    { name: 'SubJAV', url: 'http://localhost:3000/api/embed/subjav/36019' }
  ];

  for (const t of testEmbeds) {
    console.log(`\nTesting ${t.name}: ${t.url}`);
  }
}

testAllEmbedRoutes();
