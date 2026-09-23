// src/components/creator-video/CreatorLeaderboard.jsx
import { useState, useEffect } from 'react';
import { Trophy, X, Eye } from 'lucide-react';
import { creatorVideoService } from '../../services/creatorVideo.service';

const TIER_COLOR = {
    Gold: 'bg-yellow-100 text-yellow-700',
    Silver: 'bg-gray-200 text-gray-700',
    Bronze: 'bg-orange-100 text-orange-700',
};

// Modal showing the top creators for this event, ranked by total views.
const CreatorLeaderboard = ({ eventId, onClose }) => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        creatorVideoService
            .getLeaderboard(eventId)
            .then((res) => setLeaderboard(res.data.leaderboard || []))
            .finally(() => setLoading(false));
    }, [eventId]);

    return (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center px-4" onClick={onClose}>
            <div className="w-full max-w-sm bg-white rounded-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="font-black text-base text-gray-900 flex items-center gap-2">
                        <Trophy size={18} className="text-yellow-500" /> Top Creators
                    </h3>
                    <button type="button" onClick={onClose}>
                        <X size={18} className="text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-3">
                    {loading ? (
                        <p className="text-xs text-gray-400 py-6 text-center">Loading...</p>
                    ) : leaderboard.length === 0 ? (
                        <p className="text-xs text-gray-400 py-6 text-center">No creators yet for this event.</p>
                    ) : (
                        leaderboard.map((c, index) => (
                            <div key={c.creatorId} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                                <span className="w-6 text-center font-black text-sm text-gray-400">{index + 1}</span>
                                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 overflow-hidden flex-shrink-0">
                                    {c.avatar ? <img src={c.avatar} alt="" className="w-full h-full object-cover" /> : c.name?.[0]?.toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-gray-900 truncate">{c.name}</p>
                                    <p className="text-[11px] text-gray-500 flex items-center gap-1">
                                        <Eye size={11} /> {c.totalViews} views · {c.videoCount} videos
                                    </p>
                                </div>
                                {c.tier && (
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${TIER_COLOR[c.tier]}`}>
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