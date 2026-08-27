// src/components/layout/MainLayout.jsx
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { Toaster } from 'react-hot-toast';

const MainLayout = () => (
  <div className="flex flex-col min-h-screen bg-surface dark:bg-surface-dark">
    <Navbar />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 3500,
        style: { fontFamily: 'Inter, sans-serif', fontSize: '14px', borderRadius: '12px' },
        success: { iconTheme: { primary: '#ec3013', secondary: '#fff' } },
      }}
    />
  </div>
);

export default MainLayout;
