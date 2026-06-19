const data = '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1205600,RESOLUTION=854x480\nhttps://sf16-sg.tiktokcdn.top/stream/be1cb/javhd-3929-480.m3u8\n\n#EXT-X-STREAM-INF:BANDWIDTH=2890800\nhttps://sf16-sg.tiktokcdn.top/stream/be1cb/javhd-3929-720.m3u8';

// Test regex
const result = data.replace(/(https:\/\/sf16-sg\.tiktokcdn\.top[^\s]+\.m3u8)/g, function(m) { return '/api/proxy/hls?url=' + encodeURIComponent(m); });
console.log('Result:');
console.log(result);
console.log('---');
console.log('Contains proxy:', result.includes('/api/proxy/'));
