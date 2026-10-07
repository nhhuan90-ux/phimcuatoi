/**
 * Google Drive URL Parser & Audio Stream URL Generator
 */
const DriveHelper = {
    /**
     * Trích xuất Google Drive File ID từ nhiều định dạng link khác nhau
     * @param {string} input - Link Drive hoặc ID
     * @returns {string|null} - File ID hoặc null
     */
    extractId(input) {
        if (!input || typeof input !== 'string') return null;
        const clean = input.trim();
        
        // Trực tiếp là File ID (25-50 ký tự chữ, số, gạch nối, gạch dưới)
        if (/^[a-zA-Z0-9_\-]{25,50}$/.test(clean)) {
            return clean;
        }

        // Dạng: drive.google.com/file/d/FILE_ID/view...
        const fileDMatch = clean.match(/\/file\/d\/([a-zA-Z0-9_\-]+)/);
        if (fileDMatch && fileDMatch[1]) return fileDMatch[1];

        // Dạng: drive.google.com/open?id=FILE_ID
        const openIdMatch = clean.match(/[?&]id=([a-zA-Z0-9_\-]+)/);
        if (openIdMatch && openIdMatch[1]) return openIdMatch[1];

        // Dạng: docs.google.com/uc?id=FILE_ID
        const ucMatch = clean.match(/uc\?(?:.*&)?id=([a-zA-Z0-9_\-]+)/);
        if (ucMatch && ucMatch[1]) return ucMatch[1];

        return null;
    },

    /**
     * Tạo URL phát âm thanh tối ưu nhất:
     * 1. Proxy cục bộ qua FastAPI (/api/stream/{id}) -> Hỗ trợ đầy đủ Range Seeking, bỏ qua cảnh báo file lớn
     * 2. Hoặc Direct Google CDN URL nếu chạy ở chế độ standalone không có server
     * @param {string} driveIdOrUrl 
     * @param {boolean} useProxy - Mặc định true
     * @returns {string} Audio URL
     */
    getStreamUrl(driveIdOrUrl, useProxy = true) {
        if (!driveIdOrUrl) return '';
        
        // Nếu là URL âm thanh trực tiếp (mp3, wav, internet url không phải drive)
        if (driveIdOrUrl.startsWith('http') && !driveIdOrUrl.includes('drive.google.com') && !driveIdOrUrl.includes('docs.google.com')) {
            return driveIdOrUrl;
        }

        const driveId = this.extractId(driveIdOrUrl);
        if (!driveId) return driveIdOrUrl;

        const isLocalFastApi = window.location.port === "8000";
        if (useProxy && isLocalFastApi) {
            return `/api/stream/${driveId}`;
        } else {
            // Google usercontent direct download stream (vượt cảnh báo 100MB)
            return `https://drive.usercontent.google.com/download?id=${driveId}&export=download&confirm=t`;
        }
    },

    /**
     * Phân tích văn bản nhập hàng loạt các chương từ người dùng
     * Ví dụ:
     * Chương 1: https://drive.google.com/file/d/XXX/view
     * Chương 2: https://drive.google.com/file/d/YYY/view
     * Hoặc chỉ đơn giản là danh sách các link dán liên tiếp
     * @param {string} rawText 
     * @returns {Array<{title: string, driveUrl: string, driveId: string}>}
     */
    parseBatchText(rawText) {
        if (!rawText) return [];
        const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const chapters = [];
        let autoIndex = 1;

        for (const line of lines) {
            // Kiểm tra xem dòng có định dạng "Tên chương : link" hoặc "Tên chương - link"
            const separatorMatch = line.match(/^([^:-]+)[:|-]\s*(https?:\/\/[^\s]+|[a-zA-Z0-9_\-]{25,50})$/);
            
            let title = '';
            let url = '';

            if (separatorMatch) {
                title = separatorMatch[1].trim();
                url = separatorMatch[2].trim();
            } else {
                // Kiểm tra xem có chứa URL hoặc ID Drive không
                const urlMatch = line.match(/(https?:\/\/[^\s]+|[a-zA-Z0-9_\-]{25,50})/);
                if (urlMatch) {
                    url = urlMatch[1].trim();
                    // Phần còn lại của dòng là tiêu đề nếu có
                    const remaining = line.replace(url, '').replace(/^[:\-\s]+|[:\-\s]+$/g, '').trim();
                    title = remaining.length > 0 ? remaining : `Chương ${autoIndex}`;
                }
            }

            if (url) {
                const driveId = this.extractId(url) || '';
                chapters.push({
                    id: `c_${Date.now()}_${autoIndex}`,
                    title: title || `Chương ${autoIndex}`,
                    driveUrl: url,
                    driveId: driveId,
                    duration: 0
                });
                autoIndex++;
            }
        }

        return chapters;
    }
};

window.DriveHelper = DriveHelper;
