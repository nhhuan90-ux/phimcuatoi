const fs = require('fs');

const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));
console.log('Keys in movies.json:', Object.keys(moviesData));
for (const k of Object.keys(moviesData)) {
  if (Array.isArray(moviesData[k])) {
    console.log(`  Key "${k}": ${moviesData[k].length} items`);
  } else {
    console.log(`  Key "${k}":`, moviesData[k]);
  }
}
