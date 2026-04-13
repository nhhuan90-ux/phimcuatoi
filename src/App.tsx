import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Browse from './pages/Browse';
import MovieDetail from './pages/MovieDetail';
import Watch from './pages/Watch';
import Search from './pages/Search';
import History from './pages/History';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="danh-sach/:slug" element={<Browse type="danh-sach" />} />
          <Route path="the-loai/:slug" element={<Browse type="the-loai" />} />
          <Route path="quoc-gia/:slug" element={<Browse type="quoc-gia" />} />
          <Route path="nam-phat-hanh/:year" element={<Browse type="nam-phat-hanh" />} />
          <Route path="phim/:slug" element={<MovieDetail />} />
          <Route path="xem-phim/:slug/:episode" element={<Watch />} />
          <Route path="tim-kiem" element={<Search />} />
          <Route path="lich-su" element={<History />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
