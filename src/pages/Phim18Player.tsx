import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

const PHIM18_API = 'http://localhost:3000';

export default function Phim18Player() {
  const { source, id } = useParams();

  useEffect(() => {
    if (source && id) {
      document.title = 'Phim 18+ - PhimCuaToi.Online';
    }
  }, [source, id]);

  const embedUrl = source && id ? `${PHIM18_API}/player.html?source=${source}&id=${id}` : '';

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-[#111] border-b border-gray-800">
        <a href="/phim-18" className="text-white text-sm hover:text-red-500 transition-colors">&larr; Quay lại</a>
        <span className="text-gray-400 text-xs">Phim 18+</span>
      </div>
      <div className="flex-1">
        {embedUrl ? (
          <iframe src={embedUrl} className="w-full h-full border-0" allow="autoplay;fullscreen" allowFullScreen />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">Thiếu thông tin phim</div>
        )}
      </div>
    </div>
  );
}
