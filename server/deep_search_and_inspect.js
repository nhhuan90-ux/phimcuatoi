const axios = require('axios');
const cheerio = require('cheerio');
const dns = require('dns');

dns.setServers(['1.1.1.1', '8.8.8.8']);
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

async function searchYahooDomain(keyword) {
  console.log(`=== SEARCHING YAHOO FOR "${keyword}" ===`);
  try {
    const url = `https://search.yahoo.com/search?p=${encodeURIComponent(keyword)}`;
    const res = await axios.get(url, { timeout: 8000, headers: { 'User-Agent': UA } });
    const $ = cheerio.load(res.data);
    const candidates = new Set();
    $('a[href]').each((i, el) => {
      let href = $(el).attr('href') || '';
      if (href.includes('r.search.yahoo.com')) {
        const match = href.match(/\/RU=([^/]+)\/RK=/);
        if (match) href = decodeURIComponent(match[1]);
      }
      if (href.startsWith('http')) {
        try {
          const hostname = new URL(href).hostname.toLowerCase().replace(/^www\./, '');
          if (hostname.includes(keyword) && !hostname.includes('yahoo.com') && !hostname.includes('google.com')) {
            candidates.add(hostname);
          }
        } catch (e) {}
      }
    });
    console.log(`Found candidates for ${keyword}:`, Array.from(candidates));
    return Array.from(candidates);
  } catch (e) {
    console.error('Search error:', e.message);
    return [];
  }
}

async function inspectVlxxFullPage() {
  console.log('\n=== INSPECTING VLXX FULL HTML ===');
  try {
    const res = await axios.get('https://vlxx.moi/video/con-trai-giup-me-giam-can-bang-tinh-duc/3167/', {
      headers: { 'User-Agent': UA },
      timeout: 10000
    });
    console.log('VLXX Page HTML Snippet:', res.data.slice(0, 1500));
    // Find player element / scripts
    const $ = cheerio.load(res.data);
    $('#player, .player, #video-player, video').each((i, el) => {
      console.log('Player element:', $(el).parent().html()?.slice(0, 500));
    });
    $('script').each((i, el) => {
      const html = $(el).html() || '';
      if (html.includes('id') && html.includes('server')) {
        console.log('VLXX script matching server:', html);
      }
    });
  } catch (e) {
    console.error('VLXX full page error:', e.message);
  }
}

async function inspectJavsubStreamforester() {
  console.log('\n=== INSPECTING JAVSUB STREAMFORESTER HTML ===');
  const embedUrl = 'https://e.streamforester.name/videos/690504a51cad7a1a9d00e666/play?event_id=player-wrapper';
  try {
    const res = await axios.get(embedUrl, {
      timeout: 10000,
      headers: { 'User-Agent': UA, 'Referer': 'https://javsub.blog/' }
    });
    console.log('Streamforester full HTML length:', res.data.length);
    console.log('Streamforester HTML snippet:', res.data.slice(0, 1500));
    const $ = cheerio.load(res.data);
    console.log('Scripts:', $('script').map((i, el) => $(el).html()?.slice(0, 200)).get());
  } catch (e) {
    console.error('Streamforester error:', e.message);
  }
}

async function inspectJavtifulAutoliker() {
  console.log('\n=== INSPECTING JAVTIFUL AUTOLIKERAPP HTML ===');
  const embedUrl = 'https://autolikerapp.net/videos/embed/mgold-054-stream-vi-94ea972b';
  try {
    const res = await axios.get(embedUrl, {
      timeout: 10000,
      headers: { 'User-Agent': UA, 'Referer': 'https://javtiful.blog/' }
    });
    console.log('Autolikerapp full HTML length:', res.data.length);
    console.log('Autolikerapp HTML snippet:', res.data.slice(0, 1500));
  } catch (e) {
    console.error('Autolikerapp error:', e.message);
  }
}

async function run() {
  await searchYahooDomain('javhdz');
  await searchYahooDomain('phimxyz');
  await inspectVlxxFullPage();
  await inspectJavsubStreamforester();
  await inspectJavtifulAutoliker();
}

run();
