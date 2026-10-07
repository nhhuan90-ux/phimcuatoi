/**
 * Audiobook Core Player Engine
 * Supports:
 * - Smart Playback Resume (YouTube-style exact position restore)
 * - Background Playback & Lockscreen Controls via Media Session API
 * - Google Drive Stream seeking (HTTP 206 Partial Content)
 * - Auto-next chapter, Sleep Timer, Speed adjustments
 */

class AudiobookPlayer {
    constructor() {
        this.audio = new Audio();
        this.audio.preload = "metadata";
        
        // Current state
        this.currentBook = null;
        this.currentChapterIndex = 0;
        this.isPlaying = false;
        this.playbackRate = 1.0;
        this.savedSeekTime = null; // Used for resuming
        this.sleepTimerId = null;
        this.sleepTimeRemaining = 0;
        this.sleepTimerInterval = null;

        // Callback listeners for UI updates
        this.onStateChange = null;
        this.onTimeUpdate = null;
        this.onBookChange = null;
        this.onChapterChange = null;

        this._initAudioEvents();
        this._initMediaSession();
        this._initKeyboardShortcuts();
    }

    _initAudioEvents() {
        // Loaded metadata: khi biết thời lượng audio, tua đến vị trí đã lưu nếu có
        this.audio.addEventListener("loadedmetadata", () => {
            if (this.savedSeekTime !== null && this.savedSeekTime > 0) {
                const targetTime = Math.min(this.savedSeekTime, this.audio.duration - 1);
                if (targetTime > 0) {
                    this.audio.currentTime = targetTime;
                    this._showResumeToast(targetTime);
                }
                this.savedSeekTime = null;
            }
            this._updateMediaSessionPosition();
            this._notifyState();
        });

        // Time update: lưu tiến độ liên tục sau mỗi 2s
        let lastSaveTime = 0;
        this.audio.addEventListener("timeupdate", () => {
            if (this.onTimeUpdate) {
                this.onTimeUpdate(this.audio.currentTime, this.audio.duration || 0);
            }

            const now = Date.now();
            if (now - lastSaveTime > 2000) {
                this._saveCurrentProgress();
                lastSaveTime = now;
            }
            this._updateMediaSessionPosition();
        });

        // Play event
        this.audio.addEventListener("play", () => {
            this.isPlaying = true;
            this._updateMediaSessionPlaybackState("playing");
            this._notifyState();
        });

        // Pause event
        this.audio.addEventListener("pause", () => {
            this.isPlaying = false;
            this._saveCurrentProgress();
            this._updateMediaSessionPlaybackState("paused");
            this._notifyState();
        });

        // Audio ended: Tự động chuyển chương tiếp theo
        this.audio.addEventListener("ended", () => {
            this._markChapterCompleted(this.currentChapterIndex);
            
            // Nếu có hẹn giờ hết chương thì dừng
            if (this.sleepTimerId === "end_of_chapter") {
                this.clearSleepTimer();
                this.pause();
                return;
            }

            // Tự động chuyển sang chương tiếp theo
            if (this.hasNextChapter()) {
                this.nextChapter(true);
            } else {
                this.isPlaying = false;
                this._notifyState();
            }
        });

        // Error handling with auto-fallback
        this.fallbackAttempted = false;
        this.audio.addEventListener("error", (e) => {
            console.warn("Audio playback error, checking fallback:", e);
            const chapter = this.getCurrentChapter();
            
            // Nếu đang dùng proxy mà bị lỗi, tự động thử link trực tiếp Google Drive
            if (!this.fallbackAttempted && chapter && chapter.driveId) {
                this.fallbackAttempted = true;
                const directUrl = `https://drive.usercontent.google.com/download?id=${chapter.driveId}&export=download`;
                console.log("Đang chuyển sang link phát trực tiếp Google Drive:", directUrl);
                this.audio.src = directUrl;
                this.audio.load();
                if (this.isPlaying) {
                    this.play();
                }
                return;
            }

            const err = this.audio.error;
            let msg = "Lỗi khi tải audio từ Google Drive.";
            if (err) {
                if (err.code === 2) msg = "Lỗi mạng hoặc Google Drive từ chối kết nối.";
                else if (err.code === 4) msg = "Không thể phát audio. Vui lòng kiểm tra quyền chia sẻ file trên Google Drive.";
            }
            this._showNotification("⚠️ " + msg, "error");
        });

        // Save progress when user leaves or closes tab
        window.addEventListener("beforeunload", () => this._saveCurrentProgress());
        window.addEventListener("pagehide", () => this._saveCurrentProgress());
    }

    /**
     * Tích hợp Media Session API cho phép phát nhạc trong nền và điều khiển từ màn hình khóa (Lockscreen)
     */
    _initMediaSession() {
        if (!("mediaSession" in navigator)) return;

        navigator.mediaSession.setActionHandler("play", () => this.play());
        navigator.mediaSession.setActionHandler("pause", () => this.pause());
        
        navigator.mediaSession.setActionHandler("seekbackward", (details) => {
            const skip = details.seekOffset || 15;
            this.seekBy(-skip);
        });
        
        navigator.mediaSession.setActionHandler("seekforward", (details) => {
            const skip = details.seekOffset || 15;
            this.seekBy(skip);
        });

        navigator.mediaSession.setActionHandler("previoustrack", () => {
            if (this.audio.currentTime > 5) {
                this.seekTo(0);
            } else {
                this.prevChapter(true);
            }
        });

        navigator.mediaSession.setActionHandler("nexttrack", () => {
            this.nextChapter(true);
        });

        try {
            navigator.mediaSession.setActionHandler("seekto", (details) => {
                if (details.seekTime !== undefined && details.seekTime !== null) {
                    this.seekTo(details.seekTime);
                }
            });
        } catch (e) {
            // seekto might not be supported in older browsers
        }
    }

    _updateMediaSessionMetadata() {
        if (!("mediaSession" in navigator) || !this.currentBook) return;

        const chapter = this.getCurrentChapter();
        const chapterTitle = chapter ? chapter.title : "Chương sách";
        const coverUrl = this.currentBook.cover || "/static/icons/default_cover.png";

        navigator.mediaSession.metadata = new MediaMetadata({
            title: chapterTitle,
            artist: this.currentBook.author || "Audiobook Online",
            album: this.currentBook.title || "Sách nói",
            artwork: [
                { src: coverUrl, sizes: "96x96", type: "image/jpeg" },
                { src: coverUrl, sizes: "128x128", type: "image/jpeg" },
                { src: coverUrl, sizes: "192x192", type: "image/jpeg" },
                { src: coverUrl, sizes: "256x256", type: "image/jpeg" },
                { src: coverUrl, sizes: "512x512", type: "image/jpeg" }
            ]
        });
    }

    _updateMediaSessionPosition() {
        if (!("mediaSession" in navigator) || !("setPositionState" in navigator.mediaSession)) return;
        if (!this.audio.duration || isNaN(this.audio.duration)) return;

        try {
            navigator.mediaSession.setPositionState({
                duration: Math.max(this.audio.duration, 0),
                playbackRate: this.audio.playbackRate,
                position: Math.min(Math.max(this.audio.currentTime, 0), this.audio.duration)
            });
        } catch (e) {
            // Ignore position state sync hiccups
        }
    }

    _updateMediaSessionPlaybackState(state) {
        if (!("mediaSession" in navigator)) return;
        navigator.mediaSession.playbackState = state;
    }

    /**
     * Bắt phím tắt bàn phím tiện lợi
     */
    _initKeyboardShortcuts() {
        window.addEventListener("keydown", (e) => {
            // Không can thiệp khi đang gõ vào input hoặc textarea
            if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;

            if (e.code === "Space") {
                e.preventDefault();
                this.togglePlay();
            } else if (e.code === "ArrowLeft") {
                e.preventDefault();
                this.seekBy(-15);
            } else if (e.code === "ArrowRight") {
                e.preventDefault();
                this.seekBy(15);
            } else if (e.code === "ArrowUp") {
                e.preventDefault();
                this.setVolume(Math.min(this.audio.volume + 0.1, 1.0));
            } else if (e.code === "ArrowDown") {
                e.preventDefault();
                this.setVolume(Math.max(this.audio.volume - 0.1, 0.0));
            } else if (e.code === "KeyM") {
                e.preventDefault();
                this.toggleMute();
            }
        });
    }

    /**
     * Tải cuốn sách vào player
     * @param {Object} book - Dữ liệu cuốn sách
     * @param {number|null} targetChapterIndex - Chương muốn mở (nếu null sẽ lấy vị trí đã nghe dở)
     * @param {boolean} autoPlay - Có tự động phát ngay không
     * @param {number|null} customSeekTime - Vị trí giây muốn phát
     */
    loadBook(book, targetChapterIndex = null, autoPlay = false, customSeekTime = null) {
        if (!book || !book.chapters || book.chapters.length === 0) {
            this._showNotification("Sách này chưa có chương audio nào!", "warning");
            return;
        }

        this.currentBook = book;

        // Tìm tiến độ đã lưu trước đó (từ book.progress hoặc localStorage)
        const savedProgress = this.getProgress(book.id);

        let chIdx = 0;
        let seekTime = 0;

        if (targetChapterIndex !== null) {
            chIdx = targetChapterIndex;
            seekTime = customSeekTime !== null ? customSeekTime : 0;
        } else if (savedProgress) {
            chIdx = savedProgress.chapterIndex || 0;
            seekTime = customSeekTime !== null ? customSeekTime : (savedProgress.currentTime || 0);
        }

        if (chIdx >= book.chapters.length) chIdx = 0;

        this.currentChapterIndex = chIdx;
        this.savedSeekTime = seekTime;

        if (this.onBookChange) this.onBookChange(book);
        this.loadChapter(chIdx, autoPlay);
    }

    /**
     * Tải chương cụ thể
     */
    loadChapter(index, autoPlay = false) {
        if (!this.currentBook || !this.currentBook.chapters[index]) return;

        this.currentChapterIndex = index;
        this.fallbackAttempted = false;
        const chapter = this.currentBook.chapters[index];

        // Lấy stream URL thông qua backend proxy hoặc direct Google Drive
        const streamUrl = DriveHelper.getStreamUrl(chapter.driveUrl || chapter.driveId, true);
        
        this.audio.src = streamUrl;
        this.audio.playbackRate = this.playbackRate;
        this.audio.load();

        this._updateMediaSessionMetadata();

        if (this.onChapterChange) {
            this.onChapterChange(chapter, index);
        }
        this._notifyState();

        if (autoPlay) {
            this.play();
        }
    }

    play() {
        if (!this.audio.src) return;
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                this.isPlaying = true;
                this._updateMediaSessionPlaybackState("playing");
                this._notifyState();
            }).catch(error => {
                console.warn("Auto-play prevented or error:", error);
                this.isPlaying = false;
                this._notifyState();
            });
        }
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this._updateMediaSessionPlaybackState("paused");
        this._notifyState();
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    seekTo(seconds) {
        if (this.audio.duration && !isNaN(this.audio.duration)) {
            this.audio.currentTime = Math.max(0, Math.min(seconds, this.audio.duration));
            this._saveCurrentProgress();
            this._updateMediaSessionPosition();
        }
    }

    seekBy(seconds) {
        if (this.audio.duration && !isNaN(this.audio.duration)) {
            this.seekTo(this.audio.currentTime + seconds);
        }
    }

    setPlaybackRate(rate) {
        this.playbackRate = rate;
        this.audio.playbackRate = rate;
        this._updateMediaSessionPosition();
        this._notifyState();
    }

    setVolume(vol) {
        this.audio.volume = Math.max(0, Math.min(1.0, vol));
        this._notifyState();
    }

    toggleMute() {
        this.audio.muted = !this.audio.muted;
        this._notifyState();
    }

    hasNextChapter() {
        if (!this.currentBook || !this.currentBook.chapters) return false;
        return this.currentChapterIndex < this.currentBook.chapters.length - 1;
    }

    hasPrevChapter() {
        return this.currentChapterIndex > 0;
    }

    nextChapter(autoPlay = true) {
        if (this.hasNextChapter()) {
            this.savedSeekTime = 0;
            this.loadChapter(this.currentChapterIndex + 1, autoPlay);
        }
    }

    prevChapter(autoPlay = true) {
        if (this.hasPrevChapter()) {
            this.savedSeekTime = 0;
            this.loadChapter(this.currentChapterIndex - 1, autoPlay);
        }
    }

    getCurrentChapter() {
        if (!this.currentBook || !this.currentBook.chapters) return null;
        return this.currentBook.chapters[this.currentChapterIndex] || null;
    }

    // ================== HẸN GIỜ TẮT (SLEEP TIMER) ==================
    setSleepTimer(minutes) {
        this.clearSleepTimer();

        if (minutes === "end_of_chapter") {
            this.sleepTimerId = "end_of_chapter";
            this._showNotification("⏰ Đã hẹn giờ: Tắt khi hết chương này", "info");
            this._notifyState();
            return;
        }

        const totalSeconds = parseInt(minutes, 10) * 60;
        if (isNaN(totalSeconds) || totalSeconds <= 0) return;

        this.sleepTimeRemaining = totalSeconds;
        this._showNotification(`⏰ Đã hẹn giờ tắt sau ${minutes} phút`, "info");

        this.sleepTimerInterval = setInterval(() => {
            this.sleepTimeRemaining -= 1;
            if (this.sleepTimeRemaining <= 0) {
                this.clearSleepTimer();
                this._fadeAndPause();
                this._showNotification("😴 Đã hết giờ hẹn. Chúc bạn ngủ ngon!", "info");
            }
            this._notifyState();
        }, 1000);

        this.sleepTimerId = "active";
        this._notifyState();
    }

    clearSleepTimer() {
        if (this.sleepTimerInterval) {
            clearInterval(this.sleepTimerInterval);
            this.sleepTimerInterval = null;
        }
        this.sleepTimerId = null;
        this.sleepTimeRemaining = 0;
        this._notifyState();
    }

    _fadeAndPause() {
        const initialVol = this.audio.volume;
        let fadeSteps = 10;
        const fadeInterval = setInterval(() => {
            fadeSteps--;
            if (fadeSteps > 0) {
                this.audio.volume = Math.max(0, initialVol * (fadeSteps / 10));
            } else {
                clearInterval(fadeInterval);
                this.pause();
                this.audio.volume = initialVol;
            }
        }, 150);
    }

    // ================== LƯU & KHÔI PHỤC TIẾN ĐỘ (YOUTUBE STYLE) ==================
    _saveCurrentProgress() {
        if (!this.currentBook || !this.currentBook.id) return;

        const bookId = this.currentBook.id;
        const currentTime = this.audio.currentTime || 0;
        const duration = this.audio.duration || 0;
        const chapterIdx = this.currentChapterIndex;

        if (currentTime <= 1 && duration <= 0) return;

        const progressData = {
            bookId: bookId,
            chapterIndex: chapterIdx,
            currentTime: currentTime,
            duration: duration,
            updatedAt: Date.now()
        };

        // Lưu vào localStorage ngay lập tức
        localStorage.setItem(`audiobook_progress_${bookId}`, JSON.stringify(progressData));
        localStorage.setItem("audiobook_last_played_id", bookId);

        // Đồng bộ lên backend qua API /api/progress (chạy ngầm không ảnh hưởng UI)
        try {
            if (navigator.sendBeacon) {
                const blob = new Blob([JSON.stringify(progressData)], { type: "application/json" });
                navigator.sendBeacon("/api/progress", blob);
            } else {
                fetch("/api/progress", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(progressData)
                }).catch(() => {});
            }
        } catch (e) {
            // Ignore network fail, localStorage already preserved
        }
    }

    getProgress(bookId) {
        // Ưu tiên đọc từ book.progress (từ server), nếu không có thì đọc localStorage
        if (this.currentBook && this.currentBook.id === bookId && this.currentBook.progress) {
            return this.currentBook.progress;
        }
        try {
            const raw = localStorage.getItem(`audiobook_progress_${bookId}`);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return null;
    }

    getLastPlayedBookId() {
        return localStorage.getItem("audiobook_last_played_id") || null;
    }

    _markChapterCompleted(chapterIndex) {
        if (!this.currentBook) return;
        const bookId = this.currentBook.id;
        const prog = this.getProgress(bookId) || {
            bookId: bookId,
            chapterIndex: chapterIndex,
            currentTime: 0,
            duration: 0,
            completedChapters: []
        };
        const completed = new Set(prog.completedChapters || []);
        completed.add(chapterIndex);
        prog.completedChapters = Array.from(completed);
        
        localStorage.setItem(`audiobook_progress_${bookId}`, JSON.stringify(prog));
    }

    _showResumeToast(targetTime) {
        const timeStr = this.formatTime(targetTime);
        this._showNotification(`▶ Đã tiếp tục từ vị trí nghe dở (${timeStr})`, "info");
    }

    _showNotification(msg, type = "info") {
        if (window.showAppToast) {
            window.showAppToast(msg, type);
        } else {
            console.log(`[Notification ${type}]: ${msg}`);
        }
    }

    _notifyState() {
        if (this.onStateChange) {
            this.onStateChange({
                isPlaying: this.isPlaying,
                book: this.currentBook,
                chapter: this.getCurrentChapter(),
                chapterIndex: this.currentChapterIndex,
                currentTime: this.audio.currentTime || 0,
                duration: this.audio.duration || 0,
                playbackRate: this.playbackRate,
                volume: this.audio.volume,
                muted: this.audio.muted,
                sleepTimerActive: !!this.sleepTimerId,
                sleepTimeRemaining: this.sleepTimeRemaining,
                hasNext: this.hasNextChapter(),
                hasPrev: this.hasPrevChapter()
            });
        }
    }

    formatTime(sec) {
        if (!sec || isNaN(sec)) return "00:00";
        const totalSec = Math.floor(sec);
        const hours = Math.floor(totalSec / 3600);
        const minutes = Math.floor((totalSec % 3600) / 60);
        const seconds = totalSec % 60;
        
        const mStr = String(minutes).padStart(2, "0");
        const sStr = String(seconds).padStart(2, "0");
        
        if (hours > 0) {
            const hStr = String(hours).padStart(2, "0");
            return `${hStr}:${mStr}:${sStr}`;
        }
        return `${mStr}:${sStr}`;
    }
}

window.AudiobookPlayer = AudiobookPlayer;
