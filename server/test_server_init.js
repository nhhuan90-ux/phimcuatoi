const axios = require('axios');
const fs = require('fs');

async function testLocalServerRoutes() {
  console.log('=== TESTING LOCAL SERVER LOAD ===');
  const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));
  console.log('[SUCCESS] movies.json contains:', Object.keys(moviesData));
  console.log('Total movies in "all":', moviesData.all?.length);
}

testLocalServerRoutes();
