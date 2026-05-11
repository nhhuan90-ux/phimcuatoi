import { Outlet } from 'react-router-dom';
import TVHeader from './TVHeader';
import { useSpatialNavigation } from '../../hooks/useSpatialNavigation';

export default function TVLayout() {
  useSpatialNavigation();

  return (
    <div className="tv-mode" style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff' }}>
      <TVHeader />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
