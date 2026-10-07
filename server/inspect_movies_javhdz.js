const fs = require('fs');

const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));

console.log('Sample JAVHDz movies in movies.json:');
console.log(JSON.stringify(moviesData.javhdz.slice(0, 5), null, 2));
