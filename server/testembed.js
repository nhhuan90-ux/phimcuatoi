const axios = require('axios');
axios.get('http://127.0.0.1:3000/api/embed/javhdz/3920', {timeout:15000}).then(r => {
  const d = r.data;
  console.log('SIZE:', d.length);
  console.log('jwplayer.js:', d.includes('jwplayer.js'));
  console.log('jwplayer key:', d.includes('jwplayer.key'));
  console.log('id="video":', d.includes('id="video"'));
  console.log('atob:', d.includes('atob('));
  console.log('base href:', d.includes('base href'));
  if (d.includes('atob')) {
    const idx = d.indexOf('atob');
    console.log('atob context:', d.substring(idx-30, idx+80));
  }
}).catch(e => console.log(e.message));
