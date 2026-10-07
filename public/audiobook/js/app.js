/**
 * Main Application Controller for Audiobook Web
 */

document.addEventListener("DOMContentLoaded", () => {
    // Instantiate Player
    const player = new AudiobookPlayer();
    window.player = player;

    // State
    let books = [];
    let activeFilter = "all";
    let searchQuery = "";
    let selectedBookForDetail = null;
    let editingBookId = null;

    // Bảng màu Gradient hiện đại cho Typography Thumbnail
    const THUMB_GRADIENTS = [
        "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)", // Royal Indigo
        "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)", // Emerald Forest
        "linear-gradient(135deg, #4c0519 0%, #881337 50%, #9f1239 100%)", // Crimson Velvet
        "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)", // Slate Midnight
        "linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0284c7 100%)", // Sapphire Ocean
        "linear-gradient(135deg, #451a03 0%, #78350f 50%, #92400e 100%)", // Amber Dark
        "linear-gradient(135deg, #3b0764 0%, #581c87 50%, #6b21a8 100%)", // Velvet Violet
        "linear-gradient(135deg, #042f2e 0%, #115e59 50%, #0f766e 100%)"  // Deep Teal
    ];

    function getBookGradient(idOrTitle) {
        let hash = 0;
        const str = String(idOrTitle || "");
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
        }
        const idx = Math.abs(hash) % THUMB_GRADIENTS.length;
        return THUMB_GRADIENTS[idx];
    }

    function renderBookThumbnailHtml(book, size = "card") {
        if (!book) return "";
        const bg = getBookGradient(book.id || book.title);
        const chaptersCount = book.chapters ? book.chapters.length : 1;
        const author = book.author || "Chưa rõ tác giả";
        const category = book.category || "Sách nói";

        if (size === "mini") {
            return `
                <div class="mini-typography-thumb" style="background: ${bg}; width: 100%; height: 100%;">
                    <div class="mini-thumb-title">${book.title}</div>
                    <div class="mini-thumb-author">✍ ${author}</div>
                </div>
            `;
        }

        if (size === "modal") {
            return `
                <div class="book-typography-thumb" style="background: ${bg}; width: 100%; height: 100%; padding: 12px 10px;">
                    <div class="thumb-header">
                        <span class="thumb-badge">${category}</span>
                        <span class="thumb-badge-episodes">${chaptersCount} tập</span>
                    </div>
                    <div class="thumb-content">
                        <div class="thumb-title" style="font-size: 1.05rem;">${book.title}</div>
                    </div>
                    <div class="thumb-footer">
                        <div class="thumb-author">✍ ${author}</div>
                    </div>
                </div>
            `;
        }

        // Default card thumbnail
        return `
            <div class="book-typography-thumb" style="background: ${bg};">
                <svg class="thumb-bg-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3a9 9 0 0 0-9 9v7a3 3 0 0 0 3 3h1a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H5v-1a7 7 0 0 1 14 0v1h-2a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h1a3 3 0 0 0 3-3v-7a9 9 0 0 0-9-9z"/>
                </svg>
                <div class="thumb-header">
                    <span class="thumb-badge">🎧 ${category}</span>
                    <span class="thumb-badge-episodes">${chaptersCount > 1 ? chaptersCount + ' tập' : 'Trọn bộ'}</span>
                </div>
                <div class="thumb-content">
                    <div class="thumb-title">${book.title}</div>
                </div>
                <div class="thumb-footer">
                    <div class="thumb-author">✍ ${author}</div>
                </div>
                <button class="play-overlay-btn" title="Phát sách">▶</button>
            </div>
        `;
    }

    // DOM Elements
    const booksGrid = document.getElementById("booksGrid");
    const searchInput = document.getElementById("searchInput");
    const categoryBar = document.getElementById("categoryBar");
    const resumeBanner = document.getElementById("resumeBanner");
    const playerBar = document.getElementById("audioPlayerBar");

    // Player Elements
    const playBtn = document.getElementById("playBtn");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const skipBackBtn = document.getElementById("skipBackBtn");
    const skipForwardBtn = document.getElementById("skipForwardBtn");
    const progressSlider = document.getElementById("progressSlider");
    const currentTimeLabel = document.getElementById("currentTimeLabel");
    const durationLabel = document.getElementById("durationLabel");
    const playerThumb = document.getElementById("playerThumb");
    const playerTrackTitle = document.getElementById("playerTrackTitle");
    const playerTrackSub = document.getElementById("playerTrackSub");
    const speedSelect = document.getElementById("speedSelect");
    const sleepSelect = document.getElementById("sleepSelect");
    const volumeSlider = document.getElementById("volumeSlider");

    // Modal Elements
    const bookDetailModal = document.getElementById("bookDetailModal");
    const addBookModal = document.getElementById("addBookModal");

    // Initialize Toast System
    window.showAppToast = function(msg, type = "info") {
        const container = document.getElementById("toastContainer");
        if (!container) return;
        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<span>${msg}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateX(20px)";
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    };

    // ================== DATA FETCHING ==================
    async function loadBooks() {
        try {
            let res = await fetch("/api/books");
            if (!res.ok) {
                res = await fetch("/data/audiobooks.json");
            }
            if (res.ok) {
                books = await res.json();
                localStorage.setItem("audiobook_cached_library", JSON.stringify(books));
            } else {
                throw new Error("Server error");
            }
        } catch (e) {
            console.warn("Could not fetch /api/books, trying /data/audiobooks.json:", e);
            try {
                const resStatic = await fetch("/data/audiobooks.json");
                if (resStatic.ok) {
                    books = await resStatic.json();
                    localStorage.setItem("audiobook_cached_library", JSON.stringify(books));
                }
            } catch (err) {}
            if (!books || books.length === 0) {
                const cached = localStorage.getItem("audiobook_cached_library");
                if (cached) {
                    try { books = JSON.parse(cached); } catch (err) {}
                }
            }
        }

        renderCategories();
        renderBooks();
        renderResumeBanner();
    }

    // ================== RENDER LOGIC ==================
    function renderCategories() {
        const categories = new Set(["all"]);
        books.forEach(b => {
            if (b.category) categories.add(b.category);
        });

        categoryBar.innerHTML = "";
        categories.forEach(cat => {
            const chip = document.createElement("button");
            chip.className = `category-chip ${activeFilter === cat ? "active" : ""}`;
            chip.textContent = cat === "all" ? "Tất cả sách" : cat;
            chip.onclick = () => {
                activeFilter = cat;
                renderCategories();
                renderBooks();
            };
            categoryBar.appendChild(chip);
        });
    }

    function renderResumeBanner() {
        const lastBookId = player.getLastPlayedBookId();
        if (!lastBookId) {
            resumeBanner.style.display = "none";
            return;
        }

        const lastBook = books.find(b => b.id === lastBookId);
        if (!lastBook) {
            resumeBanner.style.display = "none";
            return;
        }

        const prog = player.getProgress(lastBookId);
        if (!prog || !prog.currentTime) {
            resumeBanner.style.display = "none";
            return;
        }

        const chIdx = prog.chapterIndex || 0;
        const chapter = lastBook.chapters[chIdx] || lastBook.chapters[0];
        const timeStr = player.formatTime(prog.currentTime);
        const totalStr = prog.duration > 0 ? player.formatTime(prog.duration) : "--:--";

        document.getElementById("resumeThumb").innerHTML = renderBookThumbnailHtml(lastBook, "mini");
        document.getElementById("resumeBookTitle").textContent = lastBook.title;
        document.getElementById("resumeChapterTitle").textContent = `${chapter.title} • Đã dừng ở ${timeStr} / ${totalStr}`;

        const resumeBtn = document.getElementById("resumeBtn");
        resumeBtn.onclick = () => {
            player.loadBook(lastBook, chIdx, true, prog.currentTime);
        };

        resumeBanner.style.display = "flex";
    }

    function renderBooks() {
        booksGrid.innerHTML = "";

        const filtered = books.filter(b => {
            const matchFilter = activeFilter === "all" || b.category === activeFilter;
            const q = searchQuery.toLowerCase();
            const matchSearch = !q || 
                b.title.toLowerCase().includes(q) || 
                (b.author && b.author.toLowerCase().includes(q)) ||
                (b.narrator && b.narrator.toLowerCase().includes(q));
            return matchFilter && matchSearch;
        });

        if (filtered.length === 0) {
            booksGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-dim);">
                    <div style="font-size: 40px; margin-bottom: 10px;">📚</div>
                    <h3>Chưa có sách nào phù hợp</h3>
                    <p style="margin-top: 6px;">Bấm "+ Thêm Sách Mới" ở góc trên để kết nối link Google Drive của bạn.</p>
                </div>
            `;
            return;
        }

        filtered.forEach(book => {
            const card = document.createElement("div");
            card.className = "book-card";

            const chaptersCount = book.chapters ? book.chapters.length : 0;
            const prog = player.getProgress(book.id);
            let progressPercent = 0;
            let progressText = `${chaptersCount} chương`;

            if (prog && prog.completedChapters) {
                const completedCount = prog.completedChapters.length;
                progressPercent = Math.min(100, Math.round((completedCount / (chaptersCount || 1)) * 100));
                if (completedCount > 0) {
                    progressText = `Đã nghe ${completedCount}/${chaptersCount} chương (${progressPercent}%)`;
                }
            }

            card.innerHTML = `
                <div class="book-cover-wrap">
                    ${renderBookThumbnailHtml(book, "card")}
                </div>
                <div class="book-info">
                    <div class="book-card-title">${book.title}</div>
                    <div class="book-card-author">✍ ${book.author || 'Chưa rõ tác giả'}</div>
                    <div class="book-card-footer">
                        <span>${progressText}</span>
                        <span>${book.narrator ? '🎙️ ' + book.narrator : ''}</span>
                    </div>
                    ${progressPercent > 0 ? `
                        <div class="book-progress-bar">
                            <div class="book-progress-fill" style="width: ${progressPercent}%;"></div>
                        </div>
                    ` : ''}
                </div>
            `;

            // Click play button
            const playOverlay = card.querySelector(".play-overlay-btn");
            playOverlay.onclick = (e) => {
                e.stopPropagation();
                player.loadBook(book, null, true);
            };

            // Click card opens detail
            card.onclick = () => openBookDetail(book);

            booksGrid.appendChild(card);
        });
    }

    // ================== BOOK DETAIL MODAL ==================
    function openBookDetail(book) {
        selectedBookForDetail = book;
        document.getElementById("detailCover").innerHTML = renderBookThumbnailHtml(book, "modal");
        document.getElementById("detailTitle").textContent = book.title;
        document.getElementById("detailAuthor").textContent = `Tác giả: ${book.author || "Chưa rõ"}`;
        document.getElementById("detailNarrator").textContent = book.narrator ? `Người đọc: ${book.narrator}` : "";
        document.getElementById("detailCategory").textContent = `Thể loại: ${book.category || "Chung"}`;
        document.getElementById("detailDesc").textContent = book.description || "Chưa có mô tả cho sách này.";

        const chaptersList = document.getElementById("detailChaptersList");
        chaptersList.innerHTML = "";

        const prog = player.getProgress(book.id);
        const currentSavedIdx = prog ? prog.chapterIndex : 0;
        const completedSet = new Set(prog && prog.completedChapters ? prog.completedChapters : []);

        (book.chapters || []).forEach((ch, idx) => {
            const item = document.createElement("div");
            const isPlayingThis = player.currentBook && player.currentBook.id === book.id && player.currentChapterIndex === idx;
            const isCompleted = completedSet.has(idx);

            item.className = `chapter-item ${isPlayingThis ? "active" : ""}`;
            item.innerHTML = `
                <div class="chapter-item-left">
                    <span class="chapter-num">${idx + 1}</span>
                    <span class="chapter-name">${ch.title}</span>
                </div>
                <div class="chapter-item-status">
                    ${isCompleted ? '<span style="color: var(--accent-green)">✔ Đã nghe</span>' : ''}
                    ${isPlayingThis ? '<span style="color: var(--primary)">🔊 Đang phát</span>' : ''}
                    <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.8rem;">▶ Nghe</button>
                </div>
            `;

            item.onclick = () => {
                player.loadBook(book, idx, true);
                closeModal(bookDetailModal);
            };

            chaptersList.appendChild(item);
        });

        // Setup detail actions
        document.getElementById("detailPlayAllBtn").onclick = () => {
            player.loadBook(book, 0, true);
            closeModal(bookDetailModal);
        };

        document.getElementById("detailEditBtn").onclick = () => {
            closeModal(bookDetailModal);
            openEditBook(book);
        };

        document.getElementById("detailDeleteBtn").onclick = () => {
            if (confirm(`Bạn có chắc muốn xóa cuốn sách "${book.title}" khỏi thư viện?`)) {
                deleteBook(book.id);
                closeModal(bookDetailModal);
            }
        };

        openModal(bookDetailModal);
    }

    // ================== ADD / EDIT BOOK MODAL ==================
    window.openAddBookModal = function() {
        editingBookId = null;
        document.getElementById("addBookModalTitle").textContent = "Thêm Sách Mới";
        document.getElementById("bookTitleInput").value = "";
        document.getElementById("bookAuthorInput").value = "";
        document.getElementById("bookNarratorInput").value = "";
        document.getElementById("bookCategoryInput").value = "";
        document.getElementById("bookCoverInput").value = "";
        document.getElementById("bookDescInput").value = "";
        document.getElementById("batchChaptersInput").value = "";

        switchTab("batch");
        openModal(addBookModal);
    };

    function openEditBook(book) {
        editingBookId = book.id;
        document.getElementById("addBookModalTitle").textContent = `Chỉnh Sửa Sách: ${book.title}`;
        document.getElementById("bookTitleInput").value = book.title || "";
        document.getElementById("bookAuthorInput").value = book.author || "";
        document.getElementById("bookNarratorInput").value = book.narrator || "";
        document.getElementById("bookCategoryInput").value = book.category || "";
        document.getElementById("bookCoverInput").value = book.cover || "";
        document.getElementById("bookDescInput").value = book.description || "";

        // Tạo văn bản batch từ chapters hiện tại
        const lines = (book.chapters || []).map(ch => `${ch.title}: ${ch.driveUrl || ch.driveId}`);
        document.getElementById("batchChaptersInput").value = lines.join("\n");

        switchTab("batch");
        openModal(addBookModal);
    }

    async function saveBook() {
        const title = document.getElementById("bookTitleInput").value.trim();
        if (!title) {
            alert("Vui lòng nhập tên sách!");
            return;
        }

        const author = document.getElementById("bookAuthorInput").value.trim() || "Chưa rõ tác giả";
        const narrator = document.getElementById("bookNarratorInput").value.trim();
        const category = document.getElementById("bookCategoryInput").value.trim() || "Chung";
        let cover = document.getElementById("bookCoverInput").value.trim();
        if (!cover) {
            cover = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500";
        }
        const description = document.getElementById("bookDescInput").value.trim();

        // Lấy danh sách chương từ batch input
        const rawBatch = document.getElementById("batchChaptersInput").value;
        const chapters = DriveHelper.parseBatchText(rawBatch);

        if (chapters.length === 0) {
            alert("Vui lòng nhập ít nhất một link Google Drive vào ô danh sách chương!");
            return;
        }

        const bookPayload = {
            title,
            author,
            narrator,
            category,
            cover,
            description,
            chapters
        };

        try {
            let res;
            if (editingBookId) {
                res = await fetch(`/api/books/${editingBookId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(bookPayload)
                });
            } else {
                res = await fetch("/api/books", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(bookPayload)
                });
            }

            if (res.ok) {
                window.showAppToast(`🎉 Đã ${editingBookId ? 'cập nhật' : 'thêm'} sách thành công!`, "info");
                closeModal(addBookModal);
                await loadBooks();
            } else {
                throw new Error("Lỗi lưu phía server");
            }
        } catch (e) {
            // Lưu offline vào localStorage
            if (editingBookId) {
                const idx = books.findIndex(b => b.id === editingBookId);
                if (idx !== -1) books[idx] = { ...books[idx], ...bookPayload };
            } else {
                bookPayload.id = `local-${Date.now()}`;
                books.unshift(bookPayload);
            }
            localStorage.setItem("audiobook_cached_library", JSON.stringify(books));
            window.showAppToast("Đã lưu sách vào bộ nhớ trình duyệt!", "info");
            closeModal(addBookModal);
            renderBooks();
            renderCategories();
        }
    }

    async function deleteBook(bookId) {
        try {
            await fetch(`/api/books/${bookId}`, { method: "DELETE" });
        } catch (e) {}

        books = books.filter(b => b.id !== bookId);
        localStorage.setItem("audiobook_cached_library", JSON.stringify(books));
        window.showAppToast("Đã xóa sách khỏi thư viện", "info");
        renderBooks();
        renderCategories();
        renderResumeBanner();
    }

    // ================== TAB SWITCHING IN MODAL ==================
    window.switchTab = function(tabName) {
        document.querySelectorAll(".modal-tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));

        const tabBtn = document.getElementById(`tabBtn_${tabName}`);
        const tabPane = document.getElementById(`tabPane_${tabName}`);
        if (tabBtn) tabBtn.classList.add("active");
        if (tabPane) tabPane.classList.add("active");
    };

    // Modal helpers
    function openModal(modal) {
        modal.classList.add("active");
    }
    function closeModal(modal) {
        modal.classList.remove("active");
    }
    window.closeModal = closeModal;

    // Save Book Button listener
    document.getElementById("saveBookBtn").onclick = saveBook;

    // ================== SCAN DRIVE FOLDER MODAL ==================
    const scanFolderModal = document.getElementById("scanFolderModal");
    const scanFolderUrlInput = document.getElementById("scanFolderUrlInput");
    const scanProgressMsg = document.getElementById("scanProgressMsg");
    const startScanBtn = document.getElementById("startScanBtn");

    window.openScanFolderModal = function() {
        scanFolderUrlInput.value = "";
        scanProgressMsg.style.display = "none";
        startScanBtn.disabled = false;
        openModal(scanFolderModal);
    };

    if (startScanBtn) {
        startScanBtn.onclick = async () => {
            const url = scanFolderUrlInput.value.trim();
            if (!url) {
                alert("Vui lòng dán đường link thư mục Google Drive!");
                return;
            }

            scanProgressMsg.style.display = "block";
            startScanBtn.disabled = true;

            try {
                const res = await fetch("/api/scan-folder", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ folderUrl: url })
                });

                const data = await res.json();
                if (res.ok) {
                    window.showAppToast(`🎉 ${data.message}`, "info");
                    closeModal(scanFolderModal);
                    await loadBooks();
                } else {
                    alert(`Lỗi: ${data.detail || "Không thể quét thư mục"}`);
                }
            } catch (e) {
                alert(`Lỗi kết nối máy chủ: ${e.message}`);
            } finally {
                scanProgressMsg.style.display = "none";
                startScanBtn.disabled = false;
            }
        };
    }

    // Search input live filtering
    searchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value;
        renderBooks();
    });

    // ================== PLAYER CONTROLLER BINDINGS ==================
    player.onStateChange = (state) => {
        if (!state.book) {
            playerBar.classList.add("hidden");
            return;
        }

        playerBar.classList.remove("hidden");
        playBtn.innerHTML = state.isPlaying ? "❚❚" : "▶";
        
        playerTrackTitle.textContent = state.chapter ? state.chapter.title : "Chương sách";
        playerTrackSub.textContent = `${state.book.title} • ${state.book.author || ''}`;
        playerThumb.innerHTML = renderBookThumbnailHtml(state.book, "mini");

        prevBtn.disabled = !state.hasPrev;
        nextBtn.disabled = !state.hasNext;
        prevBtn.style.opacity = state.hasPrev ? "1" : "0.3";
        nextBtn.style.opacity = state.hasNext ? "1" : "0.3";

        speedSelect.value = String(state.playbackRate);

        if (state.sleepTimerActive) {
            const m = Math.floor(state.sleepTimeRemaining / 60);
            const s = state.sleepTimeRemaining % 60;
            sleepSelect.options[0].text = `⏰ Còn ${m}:${String(s).padStart(2, '0')}`;
        } else {
            sleepSelect.options[0].text = `⏰ Hẹn giờ tắt`;
        }
    };

    player.onTimeUpdate = (currentTime, duration) => {
        currentTimeLabel.textContent = player.formatTime(currentTime);
        durationLabel.textContent = player.formatTime(duration);

        if (duration > 0) {
            const percent = (currentTime / duration) * 100;
            progressSlider.value = percent;
            progressSlider.style.background = `linear-gradient(to right, var(--primary) ${percent}%, rgba(255,255,255,0.15) ${percent}%)`;
        } else {
            progressSlider.value = 0;
        }
    };

    playBtn.onclick = () => player.togglePlay();
    prevBtn.onclick = () => player.prevChapter(true);
    nextBtn.onclick = () => player.nextChapter(true);
    skipBackBtn.onclick = () => player.seekBy(-15);
    skipForwardBtn.onclick = () => player.seekBy(15);

    progressSlider.addEventListener("input", (e) => {
        if (player.audio.duration) {
            const seekSeconds = (e.target.value / 100) * player.audio.duration;
            player.seekTo(seekSeconds);
        }
    });

    speedSelect.addEventListener("change", (e) => {
        player.setPlaybackRate(parseFloat(e.target.value));
    });

    sleepSelect.addEventListener("change", (e) => {
        const val = e.target.value;
        if (val === "0") {
            player.clearSleepTimer();
        } else {
            player.setSleepTimer(val);
        }
    });

    volumeSlider.addEventListener("input", (e) => {
        player.setVolume(parseFloat(e.target.value));
    });

    // Clicking player info reopens detail modal
    playerTrackTitle.onclick = () => {
        if (player.currentBook) openBookDetail(player.currentBook);
    };
    playerThumb.onclick = () => {
        if (player.currentBook) openBookDetail(player.currentBook);
    };

    // Close modals on clicking backdrop
    document.querySelectorAll(".modal-backdrop").forEach(modal => {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeModal(modal);
        });
    });

    // Initial load
    loadBooks();
});
