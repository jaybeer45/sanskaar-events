// src/components/creator-video/FollowListModal.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { buildRoute } from '../../constants/routes';

// title = "Followers" | "Following"; fetchFn = () => Promise (which list to load)
const FollowListModal = ({ title, fetchFn, onClose }) => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFn()
            .then((res) => setUsers(res.data.results || []))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    const openProfile = (userId) => {
        onClose();
        navigate(buildRoute.creatorProfile(userId));
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-night-deep/70 px-4" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className="flex max-h-[70vh] w-full max-w-sm flex-col rounded-2xl bg-white"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-mist px-5 py-4">
                    <h3 className="font-heading text-lg font-bold text-night">{title}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-night/5"
                    >
                        <X size={18} className="text-night/60" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-2 py-2">
                    {loading ? (
                        <p className="py-8 text-center text-sm text-ink/60">Loading...</p>
                    ) : users.length === 0 ? (
                        <p className="py-8 text-center text-sm text-ink/60">No one here yet.</p>
                    ) : (
                        users.map((u) => (
                            <button
                                key={u._id}
                                type="button"
                                onClick={() => openProfile(u._id)}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-moonlight"
                            >
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-night text-sm font-bold text-marigold">
                                    {u.avatar ? <img src={u.avatar} alt="" className="h-full w-full object-cover" /> : u.name?.[0]?.toUpperCase()}
                                </span>
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-semibold text-night">{u.name}</span>
                                    <span className="block text-xs text-ink/60">{u.followersCount ?? 0} followers</span>
                                </span>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default FollowListModal;