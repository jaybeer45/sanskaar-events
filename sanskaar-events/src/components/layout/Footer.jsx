// src/components/layout/Footer.jsx
import { Link } from 'react-router-dom';
import { Share2, AtSign, Globe } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

const linkClass = 'text-white/70 hover:text-marigold transition-colors duration-200';
const socialClass =
  'w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:bg-marigold hover:text-night transition-colors duration-200';

const Footer = () => (
  <footer className="surface-night bg-night text-white/70 mt-16">
    <div className="page-container">
      <div className="py-12 md:py-14 grid grid-cols-2 md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-x-6 gap-y-10 md:gap-8">

        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-baseline gap-1.5">
            <span className="font-body font-bold text-3xl leading-tight text-white">संस्कार</span>
            <span className="font-heading font-semibold text-sm text-white/60">events</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-white/70 max-w-xs">
            Find what's on tonight, book a ticket, or plan an event of your own.
          </p>
        </div>

        {/* Explore */}
        <div>
          <h4 className="text-white font-heading font-semibold text-base mb-4">Explore</h4>
          <ul className="space-y-3 text-sm">
            <li><Link to={ROUTES.HOME} className={linkClass}>Events</Link></li>
            <li><Link to={ROUTES.TONIGHT} className={linkClass}>Tonight</Link></li>
            <li><Link to={ROUTES.VENDORS} className={linkClass}>Vendors</Link></li>
            <li><Link to={ROUTES.MARKETPLACE} className={linkClass}>Plan an event</Link></li>
          </ul>
        </div>

        {/* For business */}
        <div>
          <h4 className="text-white font-heading font-semibold text-base mb-4">For organizers</h4>
          <ul className="space-y-3 text-sm">
            <li><Link to={ROUTES.ORGANIZER_SUBMIT} className={linkClass}>Submit an event</Link></li>
            <li><Link to={ROUTES.VENDORS} className={linkClass}>List as a vendor</Link></li>
          </ul>
        </div>

        {/* Social */}
        <div className="col-span-2 md:col-span-1">
          <h4 className="text-white font-heading font-semibold text-base mb-4">Follow us</h4>
          <div className="flex items-center gap-3">
            <a href="#" aria-label="Social media" className={socialClass}><AtSign size={17} /></a>
            <a href="#" aria-label="Share" className={socialClass}><Share2 size={17} /></a>
            <a href="#" aria-label="Website" className={socialClass}><Globe size={17} /></a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <p>© {new Date().getFullYear()} Sanskaar Events. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-marigold transition-colors duration-200">Privacy policy</a>
            <a href="#" className="hover:text-marigold transition-colors duration-200">Terms of service</a>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;