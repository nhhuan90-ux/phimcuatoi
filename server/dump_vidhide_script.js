const axios = require('axios');
axios.get('https://morencius.com/v/q5rkfaev9in8', { headers: { 'User-Agent': 'Mozilla/5.0' } })
  .then(r => console.log(r.data.match(/!function\(\).*?sandboxed\.html['"]/)[0]))
  .catch(e => console.log(e.message));
