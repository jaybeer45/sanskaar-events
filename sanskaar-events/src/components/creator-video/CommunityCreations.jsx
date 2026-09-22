// src/components/creator-video/CommunityCreations.jsx
import { useState, useEffect } from 'react';
import { Play, Heart, Sparkles } from 'lucide-react';
import { creatorVideoService } from '../../services/creatorVideo.service';
import ReelsFeed from './ReelsFeed';

// Shows public CreatorVideo entries for this event as a grid of thumbnails.
// Clicking a card opens the full-screen ReelsFeed, starting at that video.
const CommunityCreations = ({ eventId }) => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [feedStartIndex, setFeedStartIndex] = useState(null); // null = closed

    useEffect(() => {
        if (!eventId) return;
        creatorVideoService
            .getByEvent(eventId)
            .then((res) => setVideos(res.data.results || []))
            .finally(() => setLoading(false));
    }, [eventId]);

    const handleToggleLike = async (videoId) => {
        try {
            const res = await creatorVideoService.toggleLike(videoId);
            const { liked, likesCount } = res.data;
            setVideos((prev) =>
                prev.map((v) => (v._id === videoId ? { ...v, isLiked: liked, likesCount } : v))
            );
        } catch (err) {
            // silently ignore — e.g. guest not logged in; button just won't update
        }
    };

    const handleCommentsCountChange = (videoId, commentsCount) => {
        setVideos((prev) =>
            prev.map((v) => (v._id === videoId ? { ...v, commentsCount } : v))
        );
    };

    // A creator can have MULTIPLE videos in this same grid, so following them
    // updates every one of their videos, not just the one currently open.
    const handleFollowChange = (creatorId, following, followersCount) => {
        setVideos((prev) =>
            prev.map((v) =>
                v.creator?._id === creatorId
                    ? { ...v, isFollowingCreator: following, creator: { ...v.creator, followersCount } }
                    : v
            )
        );
    };

    const handleSharesCountChange = (videoId, sharesCount) => {
        setVideos((prev) =>
            prev.map((v) => (v._id === videoId ? { ...v, sharesCount } : v))
        );
    };

    if (loading || videos.length === 0) return null;

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6 mb-6 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
                <Sparkles size={18} className="text-red-500" />
                <h2 className="font-black text-lg md:text-xl text-gray-900">Community Creations</h2>
            </div>
            <p className="text-xs text-gray-500 mb-5">Videos made by fans and creators for this event</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {videos.map((v, index) => (
                    <button
                        key={v._id}
                        type="button"
                        onClick={() => setFeedStartIndex(index)}
                        className="group relative aspect-[9/16] bg-gray-900 overflow-hidden rounded-lg"
                    >
                        <video
                            src={v.videoUrl}
                            className="w-full h-full object-cover"
                            style={{ filter: v.filterCss === 'none' ? 'none' : v.filterCss }}
                            muted
                            playsInline
                            preload="metadata"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                                <Play size={16} className="text-black ml-0.5" />
                            </div>
                        </div>
                        {v.likesCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 flex items-center gap-0.5 text-[10px] font-bold text-white drop-shadow">
                                <Heart size={11} className={v.isLiked ? 'fill-brand-red text-brand-red' : 'fill-white/80 text-white/80'} />
                                {v.likesCount}
                            </span>
                        )}
                        {v.creator?.name && (
                            <span className="absolute bottom-1.5 left-1.5 right-1.5 text-[10px] font-bold text-white truncate drop-shadow">
                                @{v.creator.name}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {feedStartIndex !== null && (
                <ReelsFeed
                    videos={videos}
                    eventId={eventId}
                    startIndex={feedStartIndex}
                    onClose={() => setFeedStartIndex(null)}
                    onVideoUpdate={{
                        toggleLike: handleToggleLike,
                        commentsCount: handleCommentsCountChange,
                        shareCount: handleSharesCountChange,
                        follow: handleFollowChange,
                    }}
                />
            )}
        </div>
    );
};

export default CommunityCreations;