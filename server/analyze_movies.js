const fs = require('fs');

const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));
const subjavMovies = moviesData.subjav || [];
console.log('Total SubJAV movies:', subjavMovies.length);

const tags = {};
subjavMovies.forEach(m => {
  tags[m.tag] = (tags[m.tag] || 0) + 1;
});
console.log('Tags count for SubJAV:', tags);

console.log('\nSample SubJAV movies:');
console.log(subjavMovies.slice(0, 10));

const phimxyzMovies = moviesData.phimxyz || [];
console.log('\nTotal PhimXYZ movies:', phimxyzMovies.length);
console.log('Sample PhimXYZ movies:');
console.log(phimxyzMovies.slice(0, 5));
