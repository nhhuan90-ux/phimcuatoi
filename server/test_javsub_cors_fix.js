const axios = require('axios');
const fs = require('fs');

const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));

async function testJavsubCorsFix() {
  console.log('=== TESTING JAVSUB CORS FIX FOR JWPLAYER ===');
  const movie = moviesData.javsub[0];
  const playUrl = movie.embedUrls[0].url;

  const res = await axios.get(playUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Referer': 'https://javsub.blog/' }
  });

  let html = res.data;
  console.log('Original html snippet:', html.slice(0, 300).replace(/\n/g, ' '));

  // Rewrite m3u8 URLs inside script
  html = html.replace(/(https:\/\/[^"'\s]+\.m3u8[^"'\s]*)/g, m => '/api/proxy/hls?url=' + encodeURIComponent(m));
  html = html.replace(/if\s*\(!o\.iw\)[^;]*;/g, '/* bypass blocked */');
  html = html.replace(/window\.top\s*!==\s*window\.self/g, 'false');
  html = html.replace(/window\.self\s*!==\s*window\.top/g, 'false');
  html = html.replace(/sandbox="[^"]*"/gi, '');
  html = html.replace('<head>', '<head><base href="https://e.streamforester.name/">');

  console.log('Rewritten html length:', html.length);
  console.log('Is HLS proxy present in HTML?:', html.includes('/api/proxy/hls'));
}

testJavsubCorsFix();
