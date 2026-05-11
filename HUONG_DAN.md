# Hướng Dẫn Dự Án PhimCuaToi

Dự án này là một ứng dụng xem phim đa nền tảng, được xây dựng bằng React (Vite) với TailwindCSS. Ứng dụng hỗ trợ hai giao diện chính:
1. Giao diện Web (cho máy tính và thiết bị di động).
2. Giao diện Android TV (với điều hướng bằng remote / D-pad, giao diện được tối ưu cho màn hình lớn).

## 1. Kiến trúc và Logic dự án

Dự án được cấu trúc theo chuẩn React hiện đại:

- `src/components/`: Chứa các thành phần UI dùng chung (Ví dụ: Header, HeroSlider, Movie Grid).
  - `src/components/NetflixSlider/`: Component slider với hiệu ứng Netflix-style (hover to zoom).
  - `src/components/tv/`: Các components dành riêng cho Android TV (TVHero, TVLayout, tối ưu focus state cho remote).
- `src/pages/`: Các trang chính của ứng dụng (Home, Movie Detail, Watch, Search, Category).
  - `src/pages/tv/`: Các trang dành riêng cho giao diện Android TV.
- `src/contexts/`: Quản lý state toàn cục (Context API cho TV focus management, Auth, etc.).
- `src/hooks/`: Các custom React hooks dùng cho việc fetch API, xử lý hiệu ứng, và quản lý điều hướng D-pad.
- `src/services/`: Cấu hình API và các hàm gọi API (Lấy dữ liệu phim từ nguồn cung cấp).
- `src/utils/`: Các hàm hỗ trợ, định dạng ngày tháng, tính toán layout.

**Logic hoạt động:**
- Khi ứng dụng khởi chạy, hệ thống sẽ phát hiện thiết bị (thông qua user-agent hoặc kích thước màn hình).
- Nếu phát hiện Android TV (kể cả khi mở bằng trình duyệt web trên tivi hoặc mở ứng dụng cài đặt), hệ thống sẽ:
  - **Tự động điều hướng** (redirect) người dùng sang các trang dành riêng cho TV (đường dẫn bắt đầu bằng `/tv`).
  - Kích hoạt tính năng **Spatial Navigation** (điều hướng D-pad) hỗ trợ điều khiển bằng Remote (các phím điều hướng, OK, Back).
- Nếu là Web thông thường, ứng dụng sẽ dùng bộ layout Web truyền thống có hỗ trợ chạm (touch/swipe) cho mobile và click cho desktop.
- **Tương thích TV cũ:** Mã nguồn đã được cấu hình Vite (`build.target`) để hoạt động tốt trên các trình duyệt/WebView cũ (từ Chrome 60) nhằm tránh lỗi màn hình đen trên tivi.
- **Quyền riêng tư (SEO):** Website được thiết lập tệp `robots.txt` và thẻ `meta robots` (`noindex, nofollow`) để chặn hoàn toàn các công cụ tìm kiếm (Google, Bing...), đảm bảo tính riêng tư, chỉ những ai có link mới truy cập được.

## 2. Cài đặt và Chạy môi trường phát triển (Local)

**Yêu cầu hệ thống:**
- Node.js (phiên bản 18 trở lên)
- NPM hoặc Yarn

**Các bước thực hiện:**
1. Mở terminal tại thư mục dự án.
2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```
3. Chạy server phát triển (Development mode):
   ```bash
   npm run dev
   ```
4. Mở trình duyệt và truy cập: `http://localhost:3000` (hoặc port khác nếu báo trùng).

## 3. Hướng dẫn Deploy (Web)

Dự án đã được cấu hình sẵn cho các nền tảng deploy phổ biến như Vercel (có file `vercel.json`).

**Deploy lên Vercel:**
1. Tạo một repository trên GitHub và đẩy code của bạn lên.
2. Đăng nhập vào [Vercel](https://vercel.com/) và tạo "New Project".
3. Kết nối với GitHub Repository của bạn.
4. Cấu hình tự động nhận diện `Vite`.
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Nhấn Deploy.

**Deploy lên Netlify hoặc các nền tảng khác:**
- Tương tự như trên, hãy đảm bảo bạn trỏ "Publish Directory" về thư mục `dist` và "Build Command" là `npm run build`.

## 4. Sử dụng trên Android TV

Ứng dụng hiện hỗ trợ 2 phương thức để sử dụng trên Android TV:

### Phương thức 1: Truy cập trực tiếp qua trình duyệt web trên TV (Nhanh nhất)
Bạn **không cần** phải cài đặt app. Chỉ cần mở trình duyệt web trên tivi (ví dụ: TV Bro, Puffin TV, Chrome) và nhập tên miền trang web.
Website sẽ tự động phát hiện tivi, chuyển hướng sang giao diện tivi và cho phép sử dụng Remote (D-Pad) để thao tác như một ứng dụng Native thực thụ.

### Phương thức 2: Đóng gói thành ứng dụng cài đặt (APK bằng Capacitor)

Dự án được cấu hình sẵn Capacitor (có file `capacitor.config.ts`) để bọc ứng dụng web thành ứng dụng Native. Nếu bạn muốn cài đặt app hiển thị ở màn hình chính của tivi:

**Các bước thực hiện:**
1. Cài đặt các thư viện cần thiết (nếu chưa có):
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap init
   ```
2. Build ứng dụng web ra thư mục `dist`:
   ```bash
   npm run build
   ```
3. Thêm nền tảng Android (lần đầu tiên):
   ```bash
   npx cap add android
   ```
4. Đồng bộ code mới nhất vào dự án Android:
   ```bash
   npx cap sync android
   ```
5. Mở dự án bằng Android Studio để build ra file APK:
   ```bash
   npx cap open android
   ```
   - *Trong Android Studio*: Vào `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)` để tạo file cài đặt cho Android TV.

## 5. Các câu lệnh (Scripts) khác

- `npm run build`: Đóng gói ứng dụng để deploy lên môi trường Production.
- `npm run preview`: Xem thử ứng dụng sau khi đã build (để kiểm tra xem file build có lỗi không).
- `npm run clean`: Xóa thư mục `dist`.
- `npm run lint`: Kiểm tra lỗi TypeScript.
