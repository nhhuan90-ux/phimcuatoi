const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));
const domains = JSON.parse(fs.readFileSync('server/domains.json', 'utf-8'));

async function testJavhdz() {
  console.log('=== 1. TESTING JAVHDz ===');
  const movie = moviesData.javhdz?.[0];
  console.log('Sample movie:', movie?.id, movie?.title, movie?.link);
  const targetDomain = domains.javhdz || 'javhdz.fun';
  const url = `https://${targetDomain}/category/uncensored-3/`;
  try {
    const res = await axios.get(url, { timeout: 8000, headers: { 'User-Agent': UA } });
    const $ = cheerio.load(res.data);
    const count = $('.movie-item.m-block').length;
    console.log(`[JAVHDz] Domain https://${targetDomain} Status: ${res.status}, Movies parsed: ${count}`);

    if (movie) {
      const link = movie.link ? movie.link.replace(/javhdz\.[a-z]+/gi, targetDomain) : `https://${targetDomain}/chi-gai-${movie.id}.html`;
      const pageRes = await axios.get(link, { timeout: 8000, headers: { 'User-Agent': UA } });
      const atobMatch = pageRes.data.match(/window\.atob\(["']([^"']+)["']\)/);
      if (atobMatch) {
        console.log('  Stream decoded:', Buffer.from(atobMatch[1], 'base64').toString('utf-8'));
      } else {
        console.log('  No window.atob stream found on page!');
      }
    }
  } catch (e) {
    console.error(`[JAVHDz] Error: ${e.message}`);
  }
}

async function testVlxx() {
  console.log('\n=== 2. TESTING VLXX ===');
  const movie = moviesData.vlxx?.[0];
  console.log('Sample movie:', movie?.id, movie?.title, movie?.link);
  try {
    const hpRes = await axios.get('https://vlxx.net/', { timeout: 8000, headers: { 'User-Agent': UA } });
    console.log(`[VLXX] Domain https://vlxx.net/ Status: ${hpRes.status}`);

    if (movie) {
      const ajaxRes = await axios.post('https://vlxx.net/ajax.php', `vlxx_server=1&id=${movie.id}&server=1`, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': UA,
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': 'https://vlxx.net/'
        },
        timeout: 8000
      });
      console.log('  VLXX AJAX status:', ajaxRes.status, 'Response:', JSON.stringify(ajaxRes.data).slice(0, 200));
    }
  } catch (e) {
    console.error(`[VLXX] Error: ${e.message}`);
  }
}

async function testJavsub() {
  console.log('\n=== 3. TESTING JAVSUB ===');
  const movie = moviesData.javsub?.[0];
  console.log('Sample movie:', movie?.id, movie?.title);
  try {
    const hpRes = await axios.get('https://javsub.blog/', { timeout: 8000, headers: { 'User-Agent': UA } });
    console.log(`[JAVSub] Domain https://javsub.blog/ Status: ${hpRes.status}`);

    if (movie) {
      const movieUrl = `https://javsub.blog/phim-sex/${movie.id}`;
      const pageRes = await axios.get(movieUrl, { timeout: 8000, headers: { 'User-Agent': UA } });
      const $ = cheerio.load(pageRes.data);
      const buttons = $('button.set-player-source');
      console.log('  JAVSub player buttons count:', buttons.length);
      buttons.each((i, btn) => {
        console.log(`    Button #${i+1}: name="${$(btn).attr('data-cdn-name')}" src="${$(btn).attr('data-source')}"`);
      });
    }
  } catch (e) {
    console.error(`[JAVSub] Error: ${e.message}`);
  }
}

async function testJavtiful() {
  console.log('\n=== 4. TESTING JAVTIFUL ===');
  const movie = moviesData.javtiful?.[0];
  console.log('Sample movie:', movie?.id, movie?.title, movie?.link);
  try {
    const hpRes = await axios.get('https://javtiful.blog/', { timeout: 8000, headers: { 'User-Agent': UA } });
    console.log(`[JavTiful] Domain https://javtiful.blog/ Status: ${hpRes.status}`);

    if (movie) {
      const upperId = movie.id.toUpperCase();
      const u18Url = `https://upload18.org/play/index/${upperId}`;
      try {
        const u18Res = await axios.get(u18Url, { timeout: 8000, headers: { 'User-Agent': UA, 'Referer': 'https://javtiful.blog/' } });
        console.log(`  Upload18 ${u18Url} Status: ${u18Res.status}, Length: ${u18Res.data.length}`);
        const match = u18Res.data.match(/"m3u8"\s*:\s*"([^"]+)"/);
        console.log('  Upload18 m3u8 match:', match ? match[1].slice(0, 80) : 'none');
      } catch (err) {
        console.error(`  Upload18 error: ${err.message}`);
      }
    }
  } catch (e) {
    console.error(`[JavTiful] Error: ${e.message}`);
  }
}

async function testSubjav() {
  console.log('\n=== 5. TESTING SUBJAV ===');
  const movie = moviesData.subjav?.[0];
  console.log('Sample movie:', movie?.id, movie?.title, movie?.link);
  const targetDomain = domains.subjav || 'subjav.city';
  try {
    const hpRes = await axios.get(`https://${targetDomain}/jav-vietsub/`, { timeout: 8000, headers: { 'User-Agent': UA } });
    console.log(`[SubJAV] Domain https://${targetDomain}/jav-vietsub/ Status: ${hpRes.status}`);
    const $ = cheerio.load(hpRes.data);
    const count = $('.item-video').length;
    console.log(`  Movies count parsed: ${count}`);

    if (movie) {
      const movieRes = await axios.get(movie.link, { timeout: 8000, headers: { 'User-Agent': UA } });
      console.log(`  SubJAV movie link ${movie.link} Status: ${movieRes.status}, Length: ${movieRes.data.length}`);
    }
  } catch (e) {
    console.error(`[SubJAV] Error: ${e.message}`);
  }
}

async function run() {
  await testJavhdz();
  await testVlxx();
  await testJavsub();
  await testJavtiful();
  await testSubjav();
}

run();
