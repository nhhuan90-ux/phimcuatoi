const { checkNew } = require('./crawler.js');

async function testCheckAllNow() {
  console.log('=== RUNNING CHECK ALL UPDATES NOW ===');
  try {
    const result = await checkNew();
    console.log('[SUCCESS] Crawl completed! Total new movies added:', result.addedCount);
    console.log('  New per source:', result.newCounts);
  } catch (e) {
    console.error('Check failed:', e.message);
  }
}

testCheckAllNow();
