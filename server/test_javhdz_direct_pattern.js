const axios = require('axios');
const fs = require('fs');

const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));

async function testJavhdzDirectPattern() {
  console.log('=== TESTING DIRECT JAVHDZ HLS PATTERN ===');
  const sampleIds = ['4003', '4002', '4001', '3999', '3998'];

  for (const id of sampleIds) {
    const movie = moviesData.javhdz.find(m => m.id === id);
    console.log(`\nTesting ID: ${id} | Title: "${movie?.title?.slice(0, 30)}"`);

    // HLS playlist pattern
    const hlsUrl = `https://p16-sg.tiktokcdn.top/ad-site-i18n-sg/ec8840e153d6ef49205e6506a6fb6f704003/javhd-${id}-playlist.m3u8`;
    try {
      const res = await axios.get(hlsUrl, {
        timeout: 6000,
        headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://javhdz.cam/' }
      });
      console.log('  [SUCCESS] HLS status:', res.status, 'First line:', res.data.split('\n')[0]);
    } catch (e) {
      console.log('  [FAIL] Direct HLS fail:', e.message);
    }
  }
}

testJavhdzDirectPattern();
