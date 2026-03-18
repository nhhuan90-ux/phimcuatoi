import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans">
      <Header />
      <main className="flex-grow pt-16 lg:pt-20">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
