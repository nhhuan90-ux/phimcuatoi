const axios = require('axios');
const fs = require('fs');

const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));

async function testJavsubServers() {
  console.log('=== TESTING JAVSUB SERVERS RESOLVER ===');
  const id = 'co-giao-cuc-ky-nghiem-khac-nhung-lai-khong-mac-quan-lot-roi-sau-do';
  const movie = moviesData.javsub.find(m => m.id === id);
  console.log('Movie found in DB:', movie ? movie.title : 'NOT FOUND');

  if (movie) {
    console.log('  Embed URLs in DB:', movie.embedUrls);
  }

  // Fetch from Vercel API for server=1 and server=2
  for (let s = 1; s <= 2; s++) {
    try {
      const res = await axios.get(`https://phimcuatoi.vercel.app/api/video/javsub/${id}?server=${s}`);
      console.log(`  [Server #${s}] Status:`, res.status, 'Data:', res.data);
    } catch (e) {
      console.error(`  [Server #${s}] Error:`, e.message);
    }
  }
}

testJavsubServers();
