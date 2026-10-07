const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');
const fs = require('fs');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const agent = new https.Agent({ rejectUnauthorized: false });
const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));

async function testSubjavScrapeFallback(id) {
  const movie = moviesData.subjav.find(m => m.id === id);
  console.log('Movie found:', movie?.id, movie?.link);
  if (!movie) return;

  const targetLink = movie.link.replace(/subjav\.[a-z]+/gi, 'subjav.st');
  try {
    const res = await axios.get(targetLink, {
      timeout: 8000,
      headers: { 'User-Agent': UA },
      httpsAgent: agent
    });
    console.log('HTML status:', res.status, 'Length:', res.data.length);
    const $ = cheerio.load(res.data);
    const videoSrc = $('video source').attr('src') || $('video').attr('src') || $('iframe').attr('src');
    console.log('Extracted videoSrc:', videoSrc);
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testSubjavScrapeFallback('36019');
