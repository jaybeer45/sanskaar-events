// src/components/creator-video/CreatorLeaderboard.jsx
import { useState, useEffect } from 'react';
import { Trophy, X, Eye } from 'lucide-react';
import { creatorVideoService } from '../../services/creatorVideo.service';

const TIER_STYLE = {
    Gold: 'bg-marigold-soft text-amber-800',
    Silver: 'bg-gray-200 text-gray-700',
    Bronze: 'bg-orange-100 text-orange-800',
};

// Popup with the top creators for this event, ranked by total views.
const CreatorLeaderboard = ({ eventId, onClose }) => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        creatorVideoService
            .getLeaderboard(eventId)
            .then((res) => setLeaderboard(res.data.leaderboard || []))
            .finally(() => setLoading(false));
    }, [eventId]);

    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[60] bg-night-deep/70 flex items-center justify-center px-4"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="leaderboard-title"
                className="w-full max-w-sm bg-white rounded-2xl max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-mist">
                    <h3 id="leaderboard-title" className="font-heading font-bold text-lg text-night flex items-center gap-2">
                        <Trophy size={18} className="text-marigold" /> Top creators
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center hover:bg-night/5 transition-colors"
                    >
                        <X size={18} className="text-night/60" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-2">
                    {loading ? (
                        <p className="text-sm text-ink/60 py-8 text-center">Loading...</p>
                    ) : leaderboard.length === 0 ? (
                            <p className="text-sm text-ink/60 py-8 text-center">No creators yet for this event.</p>
                    ) : (
                        leaderboard.map((c, index) => (
                            <div key={c.creatorId} className="flex items-center gap-3 py-3 border-b border-mist/60 last:border-0">
                                <span
                                    className={`w-7 h-7 rounded-full flex items-center justify-center font-heading font-bold text-sm shrink-0 ${index === 0 ? 'bg-marigold text-night' : 'bg-night/5 text-night/60'
                                        }`}
                                >
                                    {index + 1}
                                </span>
                                <div className="w-10 h-10 rounded-full bg-night text-marigold flex items-center justify-center text-sm font-bold overflow-hidden shrink-0">
                                    {c.avatar ? (
                                        <img src={c.avatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        c.name?.[0]?.toUpperCase()
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-night truncate">{c.name}</p>
                                    <p className="text-xs text-ink/60 flex items-center gap-1">
                                        <Eye size={12} /> {c.totalViews} views, {c.videoCount} {c.videoCount === 1 ? 'video' : 'videos'}
                                    </p>
                                </div>
                                {c.tier && (
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-pill shrink-0 ${TIER_STYLE[c.tier]}`}>
                                        {c.tier}
                                    </span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreatorLeaderboard;