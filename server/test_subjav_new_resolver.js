const axios = require('axios');
const fs = require('fs');

const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));

async function testSubjavNewResolver() {
  console.log('=== TESTING SUBJAV NEW M3U8 STREAM RESOLVER ===');
  const sampleMovies = moviesData.subjav.slice(0, 5);

  for (const m of sampleMovies) {
    // Extract slug from link or title
    let slug = '';
    if (m.link) {
      const match = m.link.match(/subjav\.[a-z]+\/([^/]+)/);
      if (match) slug = match[1];
    }
    if (!slug && m.id) slug = m.id;

    console.log(`\nMovie: "${m.title.slice(0, 35)}..." | ID: ${m.id} | Slug: ${slug}`);
    const m3u8Url = `https://subjav1.blog/storage/m3u8/${slug}/index.m3u8`;

    try {
      const res = await axios.get(m3u8Url, {
        timeout: 6000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      console.log('  [SUCCESS] M3U8 status:', res.status, 'First line:', res.data.split('\n')[0]);
    } catch (e) {
      console.log('  [FALLBACK NEEDED] Direct m3u8 fail:', e.message);
    }
  }
}

testSubjavNewResolver();
