import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Search, Menu, X, User as UserIcon } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { logout } from '../../features/auth/slices/authSlice';
import CityPicker from './CityPicker';

const NAV_LINKS = [
  { label: 'Discover', to: ROUTES.HOME },
  { label: 'Tonight', to: ROUTES.TONIGHT },
  { label: 'Map', to: '/map' },
  { label: 'Vendors', to: ROUTES.VENDORS },
  { label: 'Marketplace', to: ROUTES.MARKETPLACE },
  { label: 'Organize', to: ROUTES.ORGANIZER_SUBMIT },
  { label: 'Admin', to: ROUTES.ADMIN },
];

const Navbar = () => {
  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, token } = useSelector((s) => s.auth);
  const isLoggedIn = Boolean(token && user);

  const handleLogout = () => {
    dispatch(logout());
    setProfileOpen(false);
    navigate(ROUTES.HOME);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center h-16 gap-4">
          <Link to={ROUTES.HOME} className="flex items-center gap-1.5 shrink-0">
            <span className="font-black text-xl text-black tracking-tight">SANSKAAR</span>
            <span className="inline-block w-3 h-3 bg-brand-red" />
          </Link>

          <CityPicker /> {/* ✅ static button ki jagah ye */}

          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-xl mx-auto h-12 border border-gray-300 rounded-full overflow-hidden"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events, venues, artists..."
              className="flex-1 px-5 text-sm focus:outline-none"
            />
            <button type="submit"
              className="w-14 flex items-center justify-center bg-brand-red hover:bg-brand-red-hover text-white transition-colors" >
              <Search size={18} />
            </button>
          </form>

          <div className="flex-1 md:hidden" />

          {isLoggedIn ? (
            <div className="hidden md:block relative shrink-0">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="w-10 h-10 rounded-full bg-brand-red text-white flex items-center justify-center font-bold text-sm overflow-hidden"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name?.[0]?.toUpperCase() || <UserIcon size={18} />
                )}
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-12 w-48 bg-white border border-gray-200 shadow-lg py-2 z-50">
                  <p className="px-4 py-2 text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                  <Link
                    to={ROUTES.PROFILE}
                    onClick={() => setProfileOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    My Profile
                  </Link>
                  <Link to={ROUTES.ORGANIZER_REGISTER}
                    onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"  >
                    Become an Organizer
                  </Link>
                  <Link to={ROUTES.VENDOR_DASHBOARD}
                    onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"  >
                    Become a Vendor
                  </Link>
                  <Link to={ROUTES.MY_REQUESTS}
                    onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"  >
                    My Requests
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-brand-red hover:bg-gray-50"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to={ROUTES.LOGIN}
              className="hidden md:inline-flex items-center justify-center h-11 px-6 rounded-full bg-brand-red text-white text-sm font-semibold shadow-sm transition-all duration-300 hover:bg-brand-red-hover hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 shrink-0"
            >
              Sign in
            </Link>
          )}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-9 h-9 flex items-center justify-center"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="hidden md:flex ml-28 gap-8 items-center h-14 border-t border-gray-200 bg-white px-4 lg:px-8">
          {NAV_LINKS.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              end={to === ROUTES.HOME}
              className={({ isActive }) =>
                `flex items-center h-full px-5 text-[15px] font-medium whitespace-nowrap border-b-2 transition-colors duration-200 ${isActive ? "border-brand-red text-black" : "border-transparent text-gray-600 hover:text-black"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <form onSubmit={handleSearch} className="flex px-4 py-3 border-b border-gray-100">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events..."
              className="flex-1 border border-gray-300 border-r-0 px-3 py-2 text-sm focus:outline-none"
            />
            <button type="submit" className="bg-brand-red text-white px-3 py-2">
              <Search size={14} />
            </button>
          </form>

          <nav className="py-2">
            {NAV_LINKS.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                end={to === ROUTES.HOME}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block px-6 py-3 text-sm font-medium ${isActive ? 'text-brand-red bg-red-50' : 'text-gray-700 hover:bg-gray-50'}`
                }
              >
                {label}
              </NavLink>
            ))}
            {isLoggedIn ? (
              <>
                <Link
                  to={ROUTES.PROFILE}
                  onClick={() => setMobileOpen(false)}
                  className="block mx-6 mt-4 mb-2 rounded-full border border-gray-300 py-3 text-center text-sm font-semibold text-gray-700"
                >
                  My Profile ({user?.name})
                </Link>
                <Link
                  to={ROUTES.ORGANIZER_REGISTER}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Become an Organizer
                </Link>

                <Link to={ROUTES.VENDOR_DASHBOARD}
                  onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"  >
                  Become a Vendor
                  </Link>
                  
                  <Link to={ROUTES.MY_REQUESTS}
                  onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"  >
                    My Requests
                  </Link>

                <button
                  onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="block w-[calc(100%-3rem)] mx-6 mb-3 rounded-full bg-brand-red py-3 text-center text-sm font-semibold text-white"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to={ROUTES.LOGIN}
                onClick={() => setMobileOpen(false)}
                className="block mx-6 mt-4 mb-3 rounded-full bg-brand-red py-3 text-center text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:bg-brand-red-hover hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
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