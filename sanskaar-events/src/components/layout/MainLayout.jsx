// src/components/layout/MainLayout.jsx
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import BottomNav from './BottomNav';
import { Toaster } from 'react-hot-toast';

const MainLayout = () => (
  // pb-16 leaves room for the fixed bottom bar on small screens
  <div className="flex flex-col min-h-screen bg-surface dark:bg-surface-dark pb-16 lg:pb-0">
    {/* Lets keyboard users jump past the navbar */}
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-night focus:text-white focus:px-4 focus:py-2 focus:rounded-pill"
    >
      Skip to content
    </a>
    <Navbar />
    <main id="main" className="flex-1">
      <Outlet />
    </main>
    <Footer />
    <BottomNav />
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3500,
        style: { fontFamily: 'Hind, sans-serif', fontSize: '14px', borderRadius: '12px' },
        success: { iconTheme: { primary: '#ec3013', secondary: '#fff' } },
      }}
    />
  </div>
);

export default MainLayout;