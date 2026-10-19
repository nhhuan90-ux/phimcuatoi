export async function onRequestGet(context) {
  const reqUrl = new URL(context.request.url);
  const embed = reqUrl.searchParams.get('embed');
  if (!embed) return new Response('Missing embed URL', { status: 400 });

  const cleanPlayerHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script><style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;background:#000;overflow:hidden}video{width:100%;height:100vh;display:block;object-fit:contain}</style></head><body><video id="player" controls autoplay playsinline></video><script>var v=document.getElementById('player');var src='/api/video/nguonc?embed='+encodeURIComponent(${JSON.stringify(embed)});if(typeof Hls!=='undefined'&&Hls.isSupported()){var h=new Hls({maxBufferLength:30});h.loadSource(src);h.attachMedia(v);h.on(Hls.Events.MANIFEST_PARSED,function(){v.play().catch(function(){})});h.on(Hls.Events.ERROR,function(e,d){if(d.fatal){if(d.type===Hls.ErrorTypes.NETWORK_ERROR)h.startLoad();else if(d.type===Hls.ErrorTypes.MEDIA_ERROR)h.recoverMediaError();else h.destroy()}})}else if(v.canPlayType('application/vnd.apple.mpegurl')){v.src=src;v.play().catch(function(){})}</script></body></html>`;

  return new Response(cleanPlayerHtml, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
