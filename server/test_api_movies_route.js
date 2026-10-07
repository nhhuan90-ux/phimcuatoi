const axios = require('axios');

async function testApiMoviesRoute() {
  console.log('=== TESTING /api/movies ROUTE ===');
  try {
    const res = await axios.get('http://localhost:3000/api/movies?page=1&limit=50');
    console.log('API Status:', res.status);
    console.log('Total movies:', res.data.total);
    console.log('Items count:', res.data.items?.length);
    console.log('Sample item:', res.data.items?.[0]);
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testApiMoviesRoute();
