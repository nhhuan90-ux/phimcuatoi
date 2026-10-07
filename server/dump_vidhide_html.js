const axios = require('axios');
const fs = require('fs');
axios.get('https://morencius.com/v/q5rkfaev9in8', { headers: { 'User-Agent': 'Mozilla/5.0' } })
  .then(r => {
    fs.writeFileSync('server/vidhide_html.html', r.data);
    console.log('Saved');
  })
  .catch(e => console.log(e.message));
