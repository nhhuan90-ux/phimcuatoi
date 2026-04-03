const PRIMARY_URL = 'https://phim.nguonc.com/api';
const BACKUP_URL = 'https://vsmov.com/api';

const mapEndpoint = (endpoint: string, isBackup: boolean) => {
  if (!isBackup) return endpoint;
  
  // Mapping NguonC endpoints to VSMOV
  if (endpoint === '/films/phim-moi-cap-nhat') return '/danh-sach/phim-moi-cap-nhat';
  if (endpoint.startsWith('/films/danh-sach/')) return endpoint.replace('/films/danh-sach/', '/danh-sach/');
  if (endpoint.startsWith('/films/the-loai/')) return endpoint.replace('/films/the-loai/', '/the-loai/');
  if (endpoint.startsWith('/films/quoc-gia/')) return endpoint.replace('/films/quoc-gia/', '/quoc-gia/');
  if (endpoint.startsWith('/films/nam-phat-hanh/')) return endpoint.replace('/films/nam-phat-hanh/', '/nam-phat-hanh/');
  if (endpoint.startsWith('/film/')) return endpoint.replace('/film/', '/phim/');
  if (endpoint.startsWith('/films/search')) return endpoint.replace('/films/search', '/tim-kiem');
  
  return endpoint;
};

const safeFetch = async (endpoint: string, page?: number) => {
  const pageQuery = page ? `${endpoint.includes('?') ? '&' : '?'}page=${page}` : '';
  
  try {
    const response = await fetch(`${PRIMARY_URL}${endpoint}${pageQuery}`);
    if (!response.ok) throw new Error('Primary API failed');
    return await response.json();
  } catch (error) {
    console.warn('Primary API error, falling back to Backup:', error);
    try {
      const backupEndpoint = mapEndpoint(endpoint, true);
      const response = await fetch(`${BACKUP_URL}${backupEndpoint}${pageQuery}`);
      if (!response.ok) throw new Error('Backup API failed');
      return await response.json();
    } catch (backupError) {
      console.error('All APIs failed:', backupError);
      throw backupError;
    }
  }
};

export const fetchMovies = async (endpoint: string, page: number = 1) => {
  return safeFetch(endpoint, page);
};

export const fetchMovieDetail = async (slug: string) => {
  return safeFetch(`/film/${slug}`);
};

export const searchMovies = async (keyword: string) => {
  return safeFetch(`/films/search?keyword=${encodeURIComponent(keyword)}`);
};
