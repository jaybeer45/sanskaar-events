
// src/components/layout/Footer.jsx

import { Link } from 'react-router-dom';
import {
  Zap,
  Share2,
  AtSign,
  Globe,
} from 'lucide-react';

import { ROUTES } from '../../constants/routes';

const Footer = () => {
  return (
    <footer className="bg-brand-dark text-gray-400 mt-16">
      <div className="page-container">

        {/* Main Footer */}
        <div className="py-12 md:py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">

            {/* Brand */}
            <div className="sm:col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-lg bg-brand-red/10 flex items-center justify-center">
                  <Zap
                    size={20}
                    className="fill-brand-red text-brand-red"
                  />
                </div>

                <span className="font-heading font-black text-xl tracking-wide text-white">
                  SANSKAAR
                </span>
              </div>

              <p className="text-sm leading-6 text-gray-400 max-w-xs">
                What's happening around you today?
              </p>

              <p className="text-sm leading-6 text-gray-500 max-w-xs mt-1">
                Discover events, connect with vendors, and make every
                moment memorable.
              </p>
            </div>

            {/* Explore */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-5">
                Explore
              </h4>

              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    to={ROUTES.HOME}
                    className="hover:text-brand-red transition-colors duration-200"
                  >
                    Events
                  </Link>
                </li>

                <li>
                  <Link
                    to={ROUTES.TONIGHT}
                    className="hover:text-brand-red transition-colors duration-200"
                  >
                    Tonight
                  </Link>
                </li>

                <li>
                  <Link
                    to={ROUTES.VENDORS}
                    className="hover:text-brand-red transition-colors duration-200"
                  >
                    Vendors
                  </Link>
                </li>

                <li>
                  <Link
                    to={ROUTES.MARKETPLACE}
                    className="hover:text-brand-red transition-colors duration-200"
                  >
                    Plan Event
                  </Link>
                </li>
              </ul>
            </div>

            {/* For Business */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-5">
                For Business
              </h4>

              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    to={ROUTES.ORGANIZER_SUBMIT}
                    className="hover:text-brand-red transition-colors duration-200"
                  >
                    Submit Event
                  </Link>
                </li>

                <li>
                  <Link
                    to={ROUTES.VENDORS}
                    className="hover:text-brand-red transition-colors duration-200"
                  >
                    List as Vendor
                  </Link>
                </li>
              </ul>
            </div>

            {/* Follow Us */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-5">
                Follow Us
              </h4>

              <div className="flex items-center gap-3">

                {/* Social 1 */}
                <a
                  href="#"
                  aria-label="Social Media"
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-brand-red hover:border-brand-red hover:text-white hover:-translate-y-0.5 transition-all duration-200"
                >
                  <AtSign size={17} />
                </a>

                {/* Social 2 */}
                <a
                  href="#"
                  aria-label="Share"
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-brand-red hover:border-brand-red hover:text-white hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Share2 size={17} />
                </a>

                {/* Social 3 */}
                <a
                  href="#"
                  aria-label="Website"
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-brand-red hover:border-brand-red hover:text-white hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Globe size={17} />
                </a>

              </div>
            </div>

          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">

            <p className="text-center sm:text-left">
              © {new Date().getFullYear()} Sanskaar Events.
              All rights reserved.
            </p>

            <div className="flex items-center gap-5">
              <a
                href="#"
                className="hover:text-brand-red transition-colors duration-200"
              >
                Privacy Policy
              </a>

              <a
                href="#"
                className="hover:text-brand-red transition-colors duration-200"
              >
                Terms of Service
              </a>
            </div>

          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;

