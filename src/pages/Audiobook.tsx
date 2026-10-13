import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Headphones, Play, Pause, SkipBack, SkipForward, RotateCcw, RotateCw, 
  Search, Clock, BookOpen, Volume2, VolumeX, ListMusic, X, Check, CheckCircle2,
  ChevronRight, Sparkles, Filter
} from 'lucide-react';
import audiobooksData from '../data/audiobooks.json';

interface Chapter {
  id?: string;
  title: string;
  driveUrl?: string;
  driveId?: string;
  duration?: number;
}

interface Book {
  id?: string;
  title: string;
  author?: string;
  narrator?: string;
  category?: string;
  description?: string;
  cover?: string;
  chapters: Chapter[];
}

interface ProgressData {
  bookId: string;
  chapterIndex: number;
  currentTime: number;
  duration: number;
  updatedAt: number;
  completedChapters?: number[];
}

// 8 bảng màu gradient hiện đại, tương phản cao cho typography thumbnail
const THUMB_GRADIENTS = [
  'from-indigo-950 via-indigo-900 to-indigo-800 border-indigo-700/50',
  'from-emerald-950 via-emerald-900 to-emerald-800 border-emerald-700/50',
  'from-rose-950 via-rose-900 to-rose-800 border-rose-700/50',
  'from-slate-950 via-slate-900 to-slate-800 border-slate-700/50',
  'from-sky-950 via-sky-900 to-sky-800 border-sky-700/50',
  'from-amber-950 via-amber-900 to-amber-800 border-amber-700/50',
  'from-purple-950 via-purple-900 to-purple-800 border-purple-700/50',
  'from-teal-950 via-teal-900 to-teal-800 border-teal-700/50',
];

function getBookGradient(idOrTitle: string) {
  let hash = 0;
  const str = String(idOrTitle || '');
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % THUMB_GRADIENTS.length;
  return THUMB_GRADIENTS[idx];
}

function formatTime(seconds: number) {
  if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function Audiobook() {
  const [books] = useState<Book[]>(audiobooksData as Book[]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Player State
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [savedResumeTime, setSavedResumeTime] = useState<number | null>(null);

  // Modals & Drawers
  const [selectedBookForModal, setSelectedBookForModal] = useState<Book | null>(null);
  const [isChapterDrawerOpen, setIsChapterDrawerOpen] = useState<boolean>(false);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimeRemaining, setSleepTimeRemaining] = useState<number | null>(null);

  // Audio element reference
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Danh mục thể loại duy nhất
  const categories = useMemo(() => {
    const set = new Set<string>();
    books.forEach(b => {
      if (b.category) set.add(b.category);
    });
    return Array.from(set);
  }, [books]);

  // Bộ lọc sách
  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      const matchCat = activeCategory === 'all' || b.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        b.title.toLowerCase().includes(q) || 
        (b.author && b.author.toLowerCase().includes(q)) ||
        (b.narrator && b.narrator.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [books, activeCategory, searchQuery]);

  // Lấy tiến độ đã lưu
  const getBookProgress = (bookId?: string): ProgressData | null => {
    if (!bookId) return null;
    try {
      const saved = localStorage.getItem(`audiobook_progress_${bookId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  };

  // Sách nghe gần nhất
  const lastPlayedProgress = useMemo(() => {
    const lastId = localStorage.getItem('audiobook_last_played_id');
    if (!lastId) return null;
    const book = books.find(b => b.id === lastId);
    if (!book) return null;
    const prog = getBookProgress(lastId);
    if (!prog || prog.currentTime <= 0) return null;
    return { book, progress: prog };
  }, [books, currentBook]);

  // Khởi tạo audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      if (savedResumeTime !== null && savedResumeTime > 0) {
        audio.currentTime = Math.min(savedResumeTime, (audio.duration || 1) - 1);
        setSavedResumeTime(null);
      }
    };

    let lastSave = 0;
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      const now = Date.now();
      if (now - lastSave > 2000 && currentBook?.id) {
        lastSave = now;
        saveProgress(audio.currentTime, audio.duration);
      }
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => {
      setIsPlaying(false);
      if (currentBook?.id) saveProgress(audio.currentTime, audio.duration);
    };

    const onEnded = () => {
      setIsPlaying(false);
      markCompleted(currentChapterIndex);
      // Tự động phát chương tiếp theo
      if (currentBook && currentChapterIndex < currentBook.chapters.length - 1) {
        playChapter(currentChapterIndex + 1);
      }
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, [currentBook, currentChapterIndex, savedResumeTime]);

  // Cập nhật Media Session (Màn hình khóa & phát ngầm)
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentBook) return;
    const currentChapter = currentBook.chapters[currentChapterIndex];

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentChapter ? currentChapter.title : currentBook.title,
      artist: currentBook.author || 'Audiobook',
      album: currentBook.title,
    });

    navigator.mediaSession.setActionHandler('play', () => {
      audioRef.current?.play().catch(() => {});
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      audioRef.current?.pause();
    });
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      const skip = details.seekOffset || 15;
      seekRelative(-skip);
    });
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      const skip = details.seekOffset || 15;
      seekRelative(skip);
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      if (currentChapterIndex > 0) playChapter(currentChapterIndex - 1);
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      if (currentBook && currentChapterIndex < currentBook.chapters.length - 1) {
        playChapter(currentChapterIndex + 1);
      }
    });
  }, [currentBook, currentChapterIndex]);

  // Quản lý hẹn giờ tắt
  useEffect(() => {
    if (sleepTimerMinutes === null) {
      setSleepTimeRemaining(null);
      return;
    }
    setSleepTimeRemaining(sleepTimerMinutes * 60);

    const interval = setInterval(() => {
      setSleepTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          audioRef.current?.pause();
          setIsPlaying(false);
          setSleepTimerMinutes(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimerMinutes]);

  // Lưu tiến độ vào localStorage
  const saveProgress = (cur: number, dur: number) => {
    if (!currentBook?.id) return;
    const existing = getBookProgress(currentBook.id);
    const completedSet = new Set(existing?.completedChapters || []);
    if (dur > 0 && cur / dur >= 0.95) {
      completedSet.add(currentChapterIndex);
    }

    const data: ProgressData = {
      bookId: currentBook.id,
      chapterIndex: currentChapterIndex,
      currentTime: cur,
      duration: dur,
      updatedAt: Date.now(),
      completedChapters: Array.from(completedSet)
    };

    localStorage.setItem(`audiobook_progress_${currentBook.id}`, JSON.stringify(data));
    localStorage.setItem('audiobook_last_played_id', currentBook.id);
  };

  const markCompleted = (chIdx: number) => {
    if (!currentBook?.id) return;
    const existing = getBookProgress(currentBook.id);
    const completedSet = new Set(existing?.completedChapters || []);
    completedSet.add(chIdx);
    if (existing) {
      existing.completedChapters = Array.from(completedSet);
      localStorage.setItem(`audiobook_progress_${currentBook.id}`, JSON.stringify(existing));
    }
  };

  // Phát sách
  const playBook = (book: Book, targetChapterIdx: number = 0, resumeTime: number | null = null) => {
    if (!book.chapters || book.chapters.length === 0) return;
    setCurrentBook(book);
    setCurrentChapterIndex(targetChapterIdx);

    const chapter = book.chapters[targetChapterIdx];
    const driveId = chapter.driveId || '';
    // Luồng trực tiếp Google Drive CDN với confirm=t bỏ qua cảnh báo >100MB
    const streamUrl = `https://drive.usercontent.google.com/download?id=${driveId}&export=download&confirm=t`;

    if (audioRef.current) {
      audioRef.current.src = streamUrl;
      audioRef.current.playbackRate = playbackRate;
      setSavedResumeTime(resumeTime);
      audioRef.current.load();
      audioRef.current.play().catch(err => {
        console.warn('Auto-play blocked or error:', err);
      });
    }
  };

  // Chọn chương cụ thể
  const playChapter = (index: number) => {
    if (!currentBook) return;
    setCurrentChapterIndex(index);
    const chapter = currentBook.chapters[index];
    const driveId = chapter.driveId || '';
    const streamUrl = `https://drive.usercontent.google.com/download?id=${driveId}&export=download&confirm=t`;

    if (audioRef.current) {
      audioRef.current.src = streamUrl;
      audioRef.current.currentTime = 0;
      audioRef.current.load();
      audioRef.current.play().catch(() => {});
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
  };

  const seekRelative = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.currentTime + seconds, duration));
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const changeRate = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 pb-36 pt-6 px-4 md:px-8 max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-sky-500 rounded-2xl shadow-lg shadow-indigo-500/25">
              <Headphones className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Kho Sách Nói & Audio Book
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">
                Nghe trực tuyến từ Google Drive • Tự động nhớ vị trí • Phát trong nền
              </p>
            </div>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm tên sách, tác giả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900/90 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* QUICK RESUME BANNER (NẾU CÓ BÀI NGHE DỞ) */}
      {lastPlayedProgress && (
        <div className="mb-8 p-4 md:p-5 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4 min-w-0">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getBookGradient(lastPlayedProgress.book.title)} flex flex-col justify-center items-center p-2 text-center flex-shrink-0 shadow-md`}>
              <span className="text-[10px] font-bold uppercase text-indigo-300">Đang nghe</span>
              <Headphones className="w-5 h-5 text-white mt-0.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  <Clock className="w-3 h-3" /> Tiếp tục nghe dở
                </span>
              </div>
              <h3 className="text-base font-bold text-white truncate mt-1">
                {lastPlayedProgress.book.title}
              </h3>
              <p className="text-xs text-gray-400 truncate">
                {lastPlayedProgress.book.chapters[lastPlayedProgress.progress.chapterIndex]?.title || 'Tập 1'} • Đã dừng ở {formatTime(lastPlayedProgress.progress.currentTime)} / {formatTime(lastPlayedProgress.progress.duration)}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playBook(
                lastPlayedProgress.book, 
                lastPlayedProgress.progress.chapterIndex, 
                lastPlayedProgress.progress.currentTime
              );
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30 flex-shrink-0"
          >
            <Play className="w-4 h-4 fill-current" />
            Nghe tiếp ngay
          </button>
        </div>
      )}

      {/* CATEGORY FILTER BAR */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeCategory === 'all'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-800'
          }`}
        >
          Tất cả sách ({books.length})
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* BOOK CARDS GRID (KHÔNG DÙNG BÌA ẢNH - DÙNG TYPOGRAPHY CARD CỠ LỚN) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filteredBooks.map((book) => {
          const chaptersCount = book.chapters ? book.chapters.length : 1;
          const progress = getBookProgress(book.id);
          const completedCount = progress?.completedChapters?.length || 0;
          const percent = Math.min(100, Math.round((completedCount / chaptersCount) * 100));
          const isThisPlaying = currentBook?.id === book.id && isPlaying;

          return (
            <div
              key={book.id || book.title}
              onClick={() => setSelectedBookForModal(book)}
              className="group relative flex flex-col bg-gray-900/60 rounded-2xl border border-gray-800/80 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              {/* TYPOGRAPHY THUMBNAIL (CỠ LỚN, DỄ ĐỌC, DỄ NHÌN) */}
              <div className={`relative aspect-[1/1.2] p-4 flex flex-col justify-between bg-gradient-to-br ${getBookGradient(book.title)} border-b border-white/10 overflow-hidden`}>
                {/* Background Watermark Icon */}
                <Headphones className="absolute -right-4 -bottom-4 w-28 h-28 text-white/5 pointer-events-none transform -rotate-12" />

                {/* Top badges */}
                <div className="flex items-center justify-between gap-1 z-10">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-200 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-md border border-white/10">
                    {book.category || 'Audiobook'}
                  </span>
                  <span className="text-[10px] font-bold text-white bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-md">
                    {chaptersCount > 1 ? `${chaptersCount} tập` : 'Trọn bộ'}
                  </span>
                </div>

                {/* Main Large Title */}
                <div className="my-auto z-10 py-1">
                  <h3 className="text-white font-extrabold text-base md:text-lg leading-snug line-clamp-3 drop-shadow-md">
                    {book.title}
                  </h3>
                </div>

                {/* Bottom Author Tag */}
                <div className="z-10 pt-2 border-t border-white/10">
                  <p className="text-xs font-semibold text-amber-300 drop-shadow truncate">
                    ✍ {book.author || 'Chưa rõ tác giả'}
                  </p>
                </div>

                {/* Hover Play Button Overlay */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const prog = getBookProgress(book.id);
                    const chIdx = prog ? prog.chapterIndex : 0;
                    const cTime = prog ? prog.currentTime : 0;
                    playBook(book, chIdx, cTime);
                  }}
                  className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white flex items-center justify-center shadow-lg shadow-black/50 opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-200 z-20"
                  title="Phát ngay"
                >
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </button>
              </div>

              {/* CARD FOOTER INFO */}
              <div className="p-3 flex flex-col justify-between flex-1 gap-1.5">
                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <span>
                    {completedCount > 0 ? `Đã nghe ${completedCount}/${chaptersCount} tập` : `${chaptersCount} chương audio`}
                  </span>
                  {isThisPlaying && (
                    <span className="text-indigo-400 font-semibold flex items-center gap-1 animate-pulse">
                      ● Đang phát
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                {percent > 0 && (
                  <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredBooks.length === 0 && (
        <div className="py-20 text-center text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <h3 className="text-lg font-bold text-gray-300">Không tìm thấy sách nào</h3>
          <p className="text-sm mt-1">Hãy thử tìm với từ khóa hoặc chọn thể loại khác</p>
        </div>
      )}

      {/* DETAIL MODAL / DANH SÁCH CHƯƠNG */}
      {selectedBookForModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedBookForModal(null)}
        >
          <div 
            className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-800 flex items-start gap-4">
              <div className={`w-24 h-28 rounded-xl bg-gradient-to-br ${getBookGradient(selectedBookForModal.title)} p-3 flex flex-col justify-between flex-shrink-0 shadow-lg border border-white/10`}>
                <span className="text-[10px] font-bold text-indigo-200 uppercase truncate">
                  {selectedBookForModal.category || 'Audio'}
                </span>
                <span className="text-white font-extrabold text-xs line-clamp-3 leading-tight">
                  {selectedBookForModal.title}
                </span>
                <span className="text-[10px] font-bold text-amber-300 truncate">
                  {selectedBookForModal.author || 'Tác giả'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-extrabold text-white truncate">
                    {selectedBookForModal.title}
                  </h2>
                  <button 
                    onClick={() => setSelectedBookForModal(null)}
                    className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-amber-400 font-semibold mt-1">
                  Tác giả: {selectedBookForModal.author || 'Chưa rõ'}
                </p>
                {selectedBookForModal.narrator && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Giọng đọc: {selectedBookForModal.narrator}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => {
                      playBook(selectedBookForModal, 0, 0);
                      setSelectedBookForModal(null);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Phát từ đầu
                  </button>
                  <span className="text-xs text-gray-400">
                    Tổng cộng: {selectedBookForModal.chapters.length} chương / tập
                  </span>
                </div>
              </div>
            </div>

            {/* Chapters List */}
            <div className="p-4 overflow-y-auto flex-1 divide-y divide-gray-800/60">
              {selectedBookForModal.chapters.map((ch, idx) => {
                const isPlayingThis = currentBook?.id === selectedBookForModal.id && currentChapterIndex === idx;
                const prog = getBookProgress(selectedBookForModal.id);
                const isDone = prog?.completedChapters?.includes(idx);

                return (
                  <div
                    key={ch.driveId || idx}
                    onClick={() => {
                      playBook(selectedBookForModal, idx, 0);
                      setSelectedBookForModal(null);
                    }}
                    className={`p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isPlayingThis 
                        ? 'bg-indigo-600/20 text-indigo-400 font-semibold border border-indigo-500/30' 
                        : 'hover:bg-gray-800/50 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 text-center text-xs text-gray-500 font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-sm truncate">
                        {ch.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isDone && (
                        <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đã nghe
                        </span>
                      )}
                      {isPlayingThis && (
                        <span className="text-[11px] text-indigo-400 font-bold">
                          Đang phát
                        </span>
                      )}
                      <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-300 hover:bg-indigo-600 hover:text-white transition-colors">
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* FLOATING AUDIO PLAYER (ĐÁY MÀN HÌNH) */}
      {currentBook && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-950/95 backdrop-blur-xl border-t border-gray-800 shadow-2xl px-4 py-3 md:py-3.5">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
            {/* LEFT: CURRENT TRACK INFO */}
            <div 
              onClick={() => setSelectedBookForModal(currentBook)}
              className="flex items-center gap-3 w-full md:w-1/4 cursor-pointer hover:opacity-90 transition-opacity"
            >
              <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${getBookGradient(currentBook.title)} p-1.5 flex flex-col justify-between flex-shrink-0 shadow`}>
                <span className="text-[8px] font-bold text-indigo-200 uppercase truncate">Audio</span>
                <span className="text-white font-extrabold text-[9px] line-clamp-1">{currentBook.title}</span>
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white truncate">
                  {currentBook.chapters[currentChapterIndex]?.title || currentBook.title}
                </h4>
                <p className="text-xs text-gray-400 truncate">
                  {currentBook.title} • {currentBook.author || 'Audiobook'}
                </p>
              </div>
            </div>

            {/* CENTER: CONTROLS & TIMELINE */}
            <div className="flex flex-col items-center gap-1.5 w-full md:w-2/4">
              <div className="flex items-center gap-3 md:gap-5">
                {/* Prev Chapter */}
                <button
                  disabled={currentChapterIndex <= 0}
                  onClick={() => playChapter(currentChapterIndex - 1)}
                  className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Chương trước"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                {/* Tua lùi 15s */}
                <button
                  onClick={() => seekRelative(-15)}
                  className="p-1.5 text-gray-400 hover:text-white flex items-center gap-0.5 text-xs font-bold"
                  title="Lùi 15s"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="text-[10px]">15s</span>
                </button>

                {/* PLAY / PAUSE */}
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>

                {/* Tua tới 15s */}
                <button
                  onClick={() => seekRelative(15)}
                  className="p-1.5 text-gray-400 hover:text-white flex items-center gap-0.5 text-xs font-bold"
                  title="Tới 15s"
                >
                  <span className="text-[10px]">15s</span>
                  <RotateCw className="w-4 h-4" />
                </button>

                {/* Next Chapter */}
                <button
                  disabled={currentChapterIndex >= (currentBook.chapters.length - 1)}
                  onClick={() => playChapter(currentChapterIndex + 1)}
                  className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Chương sau"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* TIMELINE SLIDER */}
              <div className="w-full flex items-center gap-2.5">
                <span className="text-[11px] text-gray-400 font-mono w-10 text-right">
                  {formatTime(currentTime)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <span className="text-[11px] text-gray-400 font-mono w-10">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* RIGHT: SPEED, SLEEP TIMER, CHAPTER LIST */}
            <div className="flex items-center justify-end gap-2.5 w-full md:w-1/4">
              {/* Playback rate */}
              <select
                value={playbackRate}
                onChange={(e) => changeRate(parseFloat(e.target.value))}
                className="bg-gray-900 border border-gray-800 text-gray-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500"
              >
                <option value="0.75">0.75x</option>
                <option value="1">1.0x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2.0x</option>
              </select>

              {/* Sleep timer */}
              <select
                value={sleepTimerMinutes || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setSleepTimerMinutes(val ? parseInt(val, 10) : null);
                }}
                className="bg-gray-900 border border-gray-800 text-gray-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500"
              >
                <option value="">
                  {sleepTimeRemaining ? `⏰ ${Math.floor(sleepTimeRemaining / 60)}p` : '⏰ Hẹn giờ'}
                </option>
                <option value="15">15 phút</option>
                <option value="30">30 phút</option>
                <option value="45">45 phút</option>
                <option value="60">60 phút</option>
              </select>

              {/* Mute toggle */}
              <button
                onClick={toggleMute}
                className="p-1.5 text-gray-400 hover:text-white"
                title={isMuted ? 'Bật âm' : 'Tắt âm'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Chapter drawer trigger */}
              <button
                onClick={() => setSelectedBookForModal(currentBook)}
                className="p-1.5 text-gray-400 hover:text-white"
                title="Danh sách chương"
              >
                <ListMusic className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
