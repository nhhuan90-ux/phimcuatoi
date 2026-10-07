const fs = require('fs');

const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));
console.log('Total SubJAV movies in DB:', moviesData.subjav.length);
console.log('Sample SubJAV movie IDs in DB:', moviesData.subjav.slice(0, 10).map(m => ({ id: m.id, link: m.link, title: m.title })));
