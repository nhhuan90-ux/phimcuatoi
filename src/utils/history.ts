export interface WatchHistoryItem {
  movieSlug: string;
  movieName: string;
  posterUrl: string;
  epSlug: string;
  epName: string;
  timePlayed: number;   // seconds
  duration: number;     // seconds
  updatedAt: number;    // timestamp
}

const HISTORY_KEY = 'phimcuatoi_watch_history';
const MAX_HISTORY_ITEMS = 50;

export const getHistory = (): WatchHistoryItem[] => {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Lỗi khi đọc lịch sử xem phim:', error);
    return [];
  }
};

export const getHistoryItem = (movieSlug: string): WatchHistoryItem | undefined => {
  const history = getHistory();
  return history.find(item => item.movieSlug === movieSlug);
};

export const saveHistoryItem = (newItem: WatchHistoryItem) => {
  let history = getHistory();
  
  // Remove if exists to move it to top
  history = history.filter(item => item.movieSlug !== newItem.movieSlug);
  
  // Add to top
  history.unshift(newItem);
  
  // Limit the array
  if (history.length > MAX_HISTORY_ITEMS) {
    history = history.slice(0, MAX_HISTORY_ITEMS);
  }
  
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Lỗi khi lưu lịch sử xem phim:', error);
  }
};

export const removeHistoryItem = (movieSlug: string) => {
  let history = getHistory();
  history = history.filter(item => item.movieSlug !== movieSlug);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Lỗi khi xoá lịch sử xem phim:', error);
  }
};

export const clearHistory = () => {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error('Lỗi khi xoá toàn bộ lịch sử:', error);
  }
};
