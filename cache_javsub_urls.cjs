/**
 * Script to pre-cache JAVSub embed URLs into movies.json
 * Run locally: node cache_javsub_urls.cjs
 * This uses your residential IP which is not blocked by Cloudflare
 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const DATA_FILE = path.join(__dirname, 'server', 'movies.json');
const CONCURRENCY = 5;
const DELAY_MS = 500;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function extractEmbedUrls(movieUrl) {
  try {
    const res = await axios.get(movieUrl, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    });
    const $ = cheerio.load(res.data);
    const sources = [];
    $('button.set-player-source').each((i, btn) => {
      let src = $(btn).attr('data-source');
      if (src) {
        src = src.replace(/&adTag=[^&]*/g, '').replace(/\?adTag=[^&]*/g, '');
        sources.push({ url: src, label: $(btn).attr('data-cdn-name') || `Server #${i+1}` });
      }
    });
    return sources;
  } catch (e) {
    return null;
  }
}

async function processBatch(movies, startIdx) {
  const batch = movies.slice(startIdx, startIdx + CONCURRENCY);
  const results = await Promise.all(batch.map(async (movie) => {
    const sources = await extractEmbedUrls(movie.link);
    if (sources && sources.length > 0) {
      movie.embedUrls = sources;
      return { id: movie.id, status: 'OK', count: sources.length };
    }
    return { id: movie.id, status: 'FAILED', count: 0 };
  }));
  return results;
}

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  const javsubMovies = data.javsub || [];
  
  // Filter movies without cached embed URLs
  const needsCache = javsubMovies.filter(m => !m.embedUrls || m.embedUrls.length === 0);
  
  console.log(`Total JAVSub movies: ${javsubMovies.length}`);
  console.log(`Already cached: ${javsubMovies.length - needsCache.length}`);
  console.log(`Need to cache: ${needsCache.length}`);
  
  if (needsCache.length === 0) {
    console.log('All movies already cached!');
    return;
  }
  
  let success = 0, failed = 0;
  
  for (let i = 0; i < needsCache.length; i += CONCURRENCY) {
    const results = await processBatch(needsCache, i);
    results.forEach(r => {
      if (r.status === 'OK') success++;
      else failed++;
    });
    
    const progress = Math.min(i + CONCURRENCY, needsCache.length);
    console.log(`[${progress}/${needsCache.length}] Success: ${success}, Failed: ${failed}`);
    
    // Save periodically every 50 movies
    if (progress % 50 === 0 || progress >= needsCache.length) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 0));
      console.log('  -> Saved to disk');
    }
    
    await sleep(DELAY_MS);
  }
  
  // Final save
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 0));
  console.log(`\nDone! Success: ${success}, Failed: ${failed}`);
}

main().catch(e => console.error('Fatal:', e));
