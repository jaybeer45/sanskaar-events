// src/components/layout/Footer.jsx
import { Link } from 'react-router-dom';
import { Zap, Share2, AtSign, Globe } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

const Footer = () => (
  <footer className="bg-brand-dark text-gray-400 pt-12 pb-6 mt-16">
    <div className="page-container">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 font-heading font-black text-xl text-white mb-3">
            <Zap size={20} className="fill-brand-red text-brand-red" />
            SANSKAAR
          </div>
          <p className="text-sm leading-relaxed">What's happening around you today?</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3 text-sm">Explore</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to={ROUTES.HOME} className="hover:text-brand-red transition-colors">Events</Link></li>
            <li><Link to={ROUTES.TONIGHT} className="hover:text-brand-red transition-colors">Tonight</Link></li>
            <li><Link to={ROUTES.VENDORS} className="hover:text-brand-red transition-colors">Vendors</Link></li>
            <li><Link to={ROUTES.MARKETPLACE} className="hover:text-brand-red transition-colors">Plan Event</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3 text-sm">For Business</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to={ROUTES.ORGANIZER_SUBMIT} className="hover:text-brand-red transition-colors">Submit Event</Link></li>
            <li><Link to={ROUTES.VENDORS} className="hover:text-brand-red transition-colors">List as Vendor</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3 text-sm">Follow Us</h4>
          <div className="flex gap-3">
            <a href="#" className="hover:text-brand-red transition-colors"><AtSign size={18} /></a>
            <a href="#" className="hover:text-brand-red transition-colors"><Share2 size={18} /></a>
            <a href="#" className="hover:text-brand-red transition-colors"><Globe size={18} /></a>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-700 pt-6 text-center text-xs">
        © 2026 Sanskaar Events. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
