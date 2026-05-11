const fs = require('fs');

async function run() {
  const data = JSON.parse(fs.readFileSync('nguonc_debug.json', 'utf8'));
  const movie = data.movie;
  const episodes = (movie?.episodes || []).map((server) => ({
    server_name: server.server_name || 'NguonC',
    items: (server.server_data || server.items || []).map((ep) => ({
      name: ep.name,
      slug: ep.slug,
      embed: ep.embed || ep.link_embed || '',
      m3u8: ep.m3u8 || ep.link_m3u8 || '',
    })),
  }));
  console.log('Episodes length:', episodes.length);
  if (episodes.length > 0) {
    console.log('Items length:', episodes[0].items.length);
  }
}
run();
