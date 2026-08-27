import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const PHIM18_API = import.meta.env.VITE_PHIM18_API || '';

export default function Phim18Player() {
  const [searchParams] = useSearchParams();
  const source = searchParams.get('source');
  const id = searchParams.get('id');

  useEffect(() => {
    if (source && id) {
      document.title = 'Phim 18+ - PhimCuaToi.Online';
    }
  }, [source, id]);

  const embedUrl = source && id ? `${PHIM18_API}/player.html?source=${source}&id=${id}` : '';

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex-1">
        {embedUrl ? (
          <iframe src={embedUrl} className="w-full h-full border-0" allow="autoplay;fullscreen" allowFullScreen sandbox="allow-scripts allow-same-origin allow-forms" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">Thiếu thông tin phim</div>
        )}
      </div>
    </div>
  );
}
