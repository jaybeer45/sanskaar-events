// src/components/layout/Navbar.jsx
import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Search, Menu, X, User as UserIcon } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { logout } from '../../features/auth/slices/authSlice';
import CityPicker from './CityPicker';

const PUBLIC_NAV_LINKS = [
  { label: 'Discover', to: ROUTES.HOME },
  { label: 'Tonight', to: ROUTES.TONIGHT },
  { label: 'Map', to: '/map' },
  { label: 'Marketplace', to: ROUTES.MARKETPLACE },
];

const getNavLinks = (isLoggedIn, roles = []) => {
  const links = [...PUBLIC_NAV_LINKS];
  if (!isLoggedIn) return links;

  const extra = [];

  // Admin can access everything, no need to also hold vendor/organizer roles
  if (roles.includes('admin')) {
    extra.push({ label: 'Vendors', to: ROUTES.VENDORS });
    extra.push({ label: 'Organize', to: ROUTES.ORGANIZER_SUBMIT });
    extra.push({ label: 'Admin', to: ROUTES.ADMIN });
    return [...links, ...extra];
  }

  if (roles.includes('vendor')) {
    extra.push({ label: 'Vendors', to: ROUTES.VENDORS });
  }
  if (roles.includes('organizer')) {
    extra.push({ label: 'Organize', to: ROUTES.ORGANIZER_SUBMIT });
  }

  return [...links, ...extra];
};

// Shared search field, used in the desktop header and the collapsible row
const SearchField = ({ query, setQuery, onSubmit, className = '', autoFocus = false }) => (
  <form onSubmit={onSubmit} role="search" className={`relative ${className}`}>
    <Search
      size={16}
      className="absolute left-4 top-1/2 -translate-y-1/2 text-night/50 pointer-events-none"
    />
    <input
      type="search"
      aria-label="Search events, venues and artists"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search events, venues, artists"
      autoFocus={autoFocus}
      className="w-full h-11 pl-10 pr-4 rounded-pill bg-moonlight border border-transparent text-sm text-ink placeholder-gray-500 focus:bg-white focus:border-night focus:outline-none transition-colors"
    />
  </form>
);

const Navbar = () => {
  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, token } = useSelector((s) => s.auth);

  const isLoggedIn = Boolean(token && user);
  const roles = useSelector((s) => s.auth.roles) || [];
  const canSeeMyEvents = roles.includes('organizer') || roles.includes('admin');
  const navLinks = getNavLinks(isLoggedIn, roles);

  const accountLinks = [
    { label: 'My profile', to: ROUTES.PROFILE },
    ...(canSeeMyEvents ? [{ label: 'My events', to: ROUTES.MY_EVENTS }] : []),
    { label: 'Become an organizer', to: ROUTES.ORGANIZER_REGISTER },
    { label: 'Become a vendor', to: ROUTES.VENDOR_DASHBOARD },
    { label: 'My requests', to: ROUTES.MY_REQUESTS },
  ];

  // Close every open menu when the route changes
  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  // Close the profile menu on outside click or Escape
  useEffect(() => {
    if (!profileOpen) return;
    const onPointerDown = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setProfileOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [profileOpen]);

  const handleLogout = () => {
    dispatch(logout());
    setProfileOpen(false);
    setMobileOpen(false);
    navigate(ROUTES.HOME);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
      setSearchOpen(false);
    }
  };

  return (
    <header className="bg-white border-b border-mist sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center h-16 gap-3 lg:gap-5">
          <Link
            to={ROUTES.HOME}
            aria-label="Sanskaar Events home"
            className="flex items-baseline gap-1.5 shrink-0"
          >
            <span className="font-body font-bold text-[26px] leading-tight text-night">संस्कार</span>
            <span className="font-heading font-semibold text-sm text-night/60">events</span>
          </Link>

          {/* Desktop navigation */}
          <nav aria-label="Main" className="hidden lg:flex items-center gap-1 ml-2">
            {navLinks.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                end={to === ROUTES.HOME}
                className={({ isActive }) =>
                  `inline-flex items-center h-10 px-4 rounded-pill text-[15px] font-medium whitespace-nowrap transition-colors ${isActive ? 'bg-night text-white' : 'text-ink/70 hover:bg-night/5 hover:text-ink'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex-1" />

          {/* Full search field from xl up, icon button below that */}
          <SearchField
            query={query}
            setQuery={setQuery}
            onSubmit={handleSearch}
            className="hidden xl:block w-64"
          />
          <button
            type="button"
            aria-label="Search"
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((v) => !v)}
            className="xl:hidden w-10 h-10 rounded-full flex items-center justify-center text-ink hover:bg-night/5 transition-colors"
          >
            <Search size={20} />
          </button>

          <CityPicker />

          {/* Account (desktop) */}
          {isLoggedIn ? (
            <div className="hidden lg:block relative shrink-0" ref={profileRef}>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                aria-label="Account menu"
                onClick={() => setProfileOpen((v) => !v)}
                className="w-10 h-10 rounded-full bg-night text-white flex items-center justify-center font-semibold text-sm overflow-hidden"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name?.[0]?.toUpperCase() || <UserIcon size={18} />
                )}
              </button>

              {profileOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-12 w-60 bg-white border border-mist rounded-2xl shadow-card py-2 z-50"
                >
                  <div className="px-4 py-2 mb-1 border-b border-mist">
                    <p className="text-sm font-semibold text-ink truncate">{user?.name}</p>
                    {user?.email && <p className="text-xs text-gray-500 truncate">{user.email}</p>}
                  </div>
                  {accountLinks.map(({ label, to }) => (
                    <Link
                      key={label}
                      to={to}
                      role="menuitem"
                      onClick={() => setProfileOpen(false)}
                      className="block px-4 py-2.5 text-sm text-ink hover:bg-night/5 transition-colors"
                    >
                      {label}
                    </Link>
                  ))}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 mt-1 text-sm font-medium text-brand-red border-t border-mist hover:bg-red-50 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
              <Link to={ROUTES.LOGIN} className="hidden lg:inline-flex btn-brand !py-2 text-sm shrink-0">
              Sign in
            </Link>
          )}

          {/* Menu button (below lg) */}
          <button
            type="button"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center text-ink hover:bg-night/5 transition-colors"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Collapsible search row (below xl) */}
      {searchOpen && (
        <div className="xl:hidden border-t border-mist bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
            <SearchField query={query} setQuery={setQuery} onSubmit={handleSearch} autoFocus />
          </div>
        </div>
      )}

      {/* Mobile menu (below lg) */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-mist bg-white max-h-[calc(100vh-4rem)] overflow-y-auto">
          <nav aria-label="Menu" className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col gap-1">
            {navLinks.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                end={to === ROUTES.HOME}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-3 rounded-xl text-base font-medium transition-colors ${isActive ? 'bg-night text-white' : 'text-ink hover:bg-night/5'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}

            <div className="my-2 border-t border-mist" />

            {isLoggedIn ? (
              <>
                <p className="px-4 py-1 text-sm text-gray-500 truncate">Signed in as {user?.name}</p>
                {accountLinks.map(({ label, to }) => (
                  <Link
                    key={label}
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 rounded-xl text-base text-ink hover:bg-night/5 transition-colors"
                  >
                    {label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-2 mb-1 w-full rounded-pill border-2 border-brand-red text-brand-red py-2.5 text-sm font-semibold hover:bg-red-50 transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to={ROUTES.LOGIN}
                onClick={() => setMobileOpen(false)}
                  className="btn-brand text-center mt-1 mb-1"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;