import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTVMode } from './contexts/TVContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Browse from './pages/Browse';
import MovieDetail from './pages/MovieDetail';
import Watch from './pages/Watch';
import Search from './pages/Search';
import History from './pages/History';
import Phim18Plus from './pages/Phim18Plus';
import Phim18Player from './pages/Phim18Player';

// TV Components
import TVLayout from './components/tv/TVLayout';
import TVHome from './pages/tv/TVHome';
import TVMovieDetail from './pages/tv/TVMovieDetail';
import TVWatch from './pages/tv/TVWatch';
import TVBrowse from './pages/tv/TVBrowse';
import TVSearch from './pages/tv/TVSearch';
import TVHistory from './pages/tv/TVHistory';

function RouteController({ children }: { children: React.ReactNode }) {
  const { isTVMode, setTVMode } = useTVMode();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tvParam = params.get('tv');
    if (tvParam === '1' && !isTVMode) {
      setTVMode(true);
    } else if (tvParam === '0' && isTVMode) {
      setTVMode(false);
    }
  }, [location.search, isTVMode, setTVMode]);

  // Redirect to TV routes if TV mode is detected and we're not already on a TV route
  if (isTVMode && !location.pathname.startsWith('/tv')) {
    const newPath = location.pathname === '/' ? '/tv' : `/tv${location.pathname}`;
    return <Navigate to={newPath + location.search} replace />;
  }

  // Redirect to web routes if NOT in TV mode and we are on a TV route
  if (!isTVMode && location.pathname.startsWith('/tv')) {
    const newPath = location.pathname.replace(/^\/tv/, '') || '/';
    return <Navigate to={newPath + location.search} replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <RouteController>
        <Routes>
        {/* === TV Routes === */}
        <Route path="/tv" element={<TVLayout />}>
          <Route index element={<TVHome />} />
          <Route path="danh-sach/:slug" element={<TVBrowse type="danh-sach" />} />
          <Route path="the-loai/:slug" element={<TVBrowse type="the-loai" />} />
          <Route path="quoc-gia/:slug" element={<TVBrowse type="quoc-gia" />} />
          <Route path="nam-phat-hanh/:year" element={<TVBrowse type="nam-phat-hanh" />} />
          <Route path="phim/:slug" element={<TVMovieDetail />} />
          <Route path="xem-phim/:slug/:episode" element={<TVWatch />} />
          <Route path="tim-kiem" element={<TVSearch />} />
          <Route path="lich-su" element={<TVHistory />} />
        </Route>

        {/* === Web Routes (existing) === */}
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
          <Route path="phim-18" element={<Phim18Plus />} />
        </Route>
        {/* === Phim 18+ Player (fullscreen, no layout) === */}
        <Route path="/phim-18/player" element={<Phim18Player />} />
      </Routes>
      </RouteController>
    </BrowserRouter>
  );
}

export default App;
