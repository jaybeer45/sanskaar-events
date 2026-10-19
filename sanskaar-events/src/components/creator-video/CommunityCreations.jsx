// src/components/creator-video/CommunityCreations.jsx
import { useState, useEffect, useCallback } from 'react';
import { Play, Heart, Trophy } from 'lucide-react';
import { creatorVideoService } from '../../services/creatorVideo.service';
import ReelsFeed from './ReelsFeed';
import CreatorLeaderboard from './CreatorLeaderboard';

const PAGE_SIZE = 8;

// Public creator videos for this event as a grid of thumbnails.
// Tapping one opens the full-screen ReelsFeed at that video.
const CommunityCreations = ({ eventId }) => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true); // first load only
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [feedStartIndex, setFeedStartIndex] = useState(null); // null = feed closed
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    useEffect(() => {
        if (!eventId) return;
        setLoading(true);
        creatorVideoService
            .getByEvent(eventId, 1, PAGE_SIZE)
            .then((res) => {
                setVideos(res.data.results || []);
                setHasMore(res.data.hasMore);
                setPage(1);
            })
            .finally(() => setLoading(false));
    }, [eventId]);

    // Used by the grid's "Show more" button and by ReelsFeed's infinite scroll
    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        try {
            const nextPage = page + 1;
            const res = await creatorVideoService.getByEvent(eventId, nextPage, PAGE_SIZE);
            setVideos((prev) => [...prev, ...(res.data.results || [])]);
            setHasMore(res.data.hasMore);
            setPage(nextPage);
        } finally {
            setLoadingMore(false);
        }
    }, [eventId, page, hasMore, loadingMore]);

    const handleToggleLike = async (videoId) => {
        try {
            const res = await creatorVideoService.toggleLike(videoId);
            const { liked, likesCount } = res.data;
            setVideos((prev) =>
                prev.map((v) => (v._id === videoId ? { ...v, isLiked: liked, likesCount } : v))
            );
        } catch (err) {
            // ignored, e.g. a guest who is not logged in
        }
    };

    const handleCommentsCountChange = (videoId, commentsCount) => {
        setVideos((prev) => prev.map((v) => (v._id === videoId ? { ...v, commentsCount } : v)));
    };

    // A creator can have several videos in this grid, so following them
    // updates all of their videos, not just the open one.
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
        setVideos((prev) => prev.map((v) => (v._id === videoId ? { ...v, sharesCount } : v)));
    };

    if (loading) {
        return (
            <section className="card p-6 mb-6">
                <h2 className="font-heading font-bold text-xl text-night mb-4">Community creations</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="skeleton aspect-[9/16] !rounded-xl" />
                    ))}
                </div>
            </section>
        );
    }

    if (videos.length === 0) return null;

    return (
        <section className="card p-6 mb-6">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                <div>
                    <h2 className="font-heading font-bold text-xl text-night">Community creations</h2>
                    <p className="text-sm text-ink/60 mt-1">Videos made by fans and creators for this event</p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowLeaderboard(true)}
                    className="inline-flex items-center gap-1.5 rounded-pill bg-marigold-soft text-night text-sm font-semibold px-4 py-2 hover:bg-marigold/40 transition-colors"
                >
                    <Trophy size={15} /> Top creators
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {videos.map((v, index) => (
                    <button
                        key={v._id}
                        type="button"
                        onClick={() => setFeedStartIndex(index)}
                        aria-label={`Play video by ${v.creator?.name || 'a creator'}`}
                        className="relative aspect-[9/16] overflow-hidden rounded-xl bg-night text-left"
                    >
                        <video
                            src={v.videoUrl}
                            className="w-full h-full object-cover pointer-events-none"
                            style={{ filter: v.filterCss === 'none' ? 'none' : v.filterCss }}
                            muted
                            playsInline
                            preload="metadata"
                        />

                        <span className="absolute inset-0 flex items-center justify-center bg-black/15">
                            <span className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                                <Play size={16} className="text-night ml-0.5" />
                            </span>
                        </span>

                        {v.likesCount > 0 && (
                            <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-pill bg-black/45 px-2 py-0.5 text-xs font-semibold text-white">
                                <Heart
                                    size={11}
                                    className={v.isLiked ? 'fill-brand-red text-brand-red' : 'fill-white text-white'}
                                />
                                {v.likesCount}
                            </span>
                        )}

                        {v.creator?.name && (
                            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 pb-2 pt-6 text-xs font-semibold text-white truncate">
                                @{v.creator.name}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {hasMore && (
                <div className="text-center mt-5">
                    <button
                        type="button"
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="btn-outline text-sm disabled:opacity-50"
                    >
                        {loadingMore ? 'Loading...' : 'Show more videos'}
                    </button>
                </div>
            )}

            {feedStartIndex !== null && (
                <ReelsFeed
                    videos={videos}
                    eventId={eventId}
                    startIndex={feedStartIndex}
                    hasMore={hasMore}
                    loadingMore={loadingMore}
                    onLoadMore={loadMore}
                    onClose={() => setFeedStartIndex(null)}
                    onVideoUpdate={{
                        toggleLike: handleToggleLike,
                        commentsCount: handleCommentsCountChange,
                        shareCount: handleSharesCountChange,
                        follow: handleFollowChange,
                    }}
                />
            )}

            {showLeaderboard && (
                <CreatorLeaderboard eventId={eventId} onClose={() => setShowLeaderboard(false)} />
            )}
        </section>
    );
};

export default CommunityCreations;