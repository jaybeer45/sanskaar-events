// src/pages/NotFound/NotFoundPage.jsx
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

const NotFoundPage = () => (
  <div className="min-h-[80vh] flex flex-col items-center justify-center text-center page-container animate-fade-in">
    <div className="text-8xl mb-4">🎪</div>
    <h1 className="font-heading font-black text-4xl text-gray-900 mb-3">404 — Page Not Found</h1>
    <p className="text-gray-500 text-lg mb-8">The page you're looking for doesn't exist or has been moved.</p>
    <Link to={ROUTES.HOME} className="btn-brand text-base px-8 py-3.5">
      ← Back to Events
    </Link>
  </div>
);

export default NotFoundPage;
