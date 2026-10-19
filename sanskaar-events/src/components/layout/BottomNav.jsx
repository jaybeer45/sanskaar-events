// src/components/layout/BottomNav.jsx
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Compass, Moon, Map as MapIcon, Store, User as UserIcon } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

// Thumb-reach navigation for phones and small tablets (hidden from lg up)
const BottomNav = () => {
    const { user, token } = useSelector((s) => s.auth);
    const isLoggedIn = Boolean(token && user);

    const tabs = [
        { label: 'Discover', to: ROUTES.HOME, icon: Compass, end: true },
        { label: 'Tonight', to: ROUTES.TONIGHT, icon: Moon },
        { label: 'Map', to: '/map', icon: MapIcon },
        { label: 'Marketplace', to: ROUTES.MARKETPLACE, icon: Store },
        isLoggedIn
            ? { label: 'Profile', to: ROUTES.PROFILE, icon: UserIcon }
            : { label: 'Sign in', to: ROUTES.LOGIN, icon: UserIcon },
    ];

    return (
        <nav
            aria-label="Primary"
            className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-mist"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <ul className="grid grid-cols-5">
                {tabs.map(({ label, to, icon: Icon, end }) => (
                    <li key={to}>
                        <NavLink
                            to={to}
                            end={end}
                            className={({ isActive }) =>
                                `relative flex flex-col items-center justify-center gap-0.5 h-16 text-[11px] font-medium transition-colors ${isActive ? 'text-night' : 'text-gray-500'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <span
                                        className={`absolute top-0 h-0.5 w-8 rounded-full ${isActive ? 'bg-marigold' : 'bg-transparent'
                                            }`}
                                    />
                                    <Icon size={22} strokeWidth={isActive ? 2.4 : 1.8} />
                                    {label}
                                </>
                            )}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default BottomNav;