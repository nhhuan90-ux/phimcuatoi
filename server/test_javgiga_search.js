const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));

async function testJavgigaSearch() {
  console.log('=== TESTING JAVGIGA CODE/SEARCH MATCHING ===');

  const movie = moviesData.javhdz[0]; // 4003 - Satsuki Mei
  const query = 'satsuki mei';

  console.log(`Searching for "${query}" on javgiga.net...`);

  try {
    const searchUrl = `https://javgiga.net/?s=${encodeURIComponent(query)}`;
    const res = await axios.get(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(res.data);

    const firstMovieLink = $('a[href*="javgiga.net/"]').first().attr('href');
    console.log('Search first movie result:', firstMovieLink);

    if (firstMovieLink) {
      const movieRes = await axios.get(firstMovieLink, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const $m = cheerio.load(movieRes.data);
      const iframeSrc = $m('iframe[src*="morencius"], iframe[src*="vidhide"], iframe').first().attr('src');
      console.log('Extracted VidHide iframe src:', iframeSrc);
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testJavgigaSearch();
