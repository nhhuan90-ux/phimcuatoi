const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));

async function inspectStreamforesterJs() {
  const movie = moviesData.javsub[0];
  const playUrl = movie.embedUrls[0].url;

  const res = await axios.get(playUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Referer': 'https://javsub.blog/' }
  });

  const $ = cheerio.load(res.data);
  console.log('=== STREAMFORESTER HTML SCRIPTS ===');
  $('script').each((i, el) => {
    const text = $(el).html() || '';
    console.log(`Script #${i}:`, text.slice(0, 400).replace(/\n/g, ' '));
  });
}

inspectStreamforesterJs();
