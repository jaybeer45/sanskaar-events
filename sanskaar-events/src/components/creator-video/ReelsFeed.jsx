// src/components/creator-video/ReelsFeed.jsx
import { useEffect, useRef, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import ReelVideoCard from './ReelVideoCard';
import CommentsPanel from './CommentsPanel';

const ReelsFeed = ({
    videos,
    eventId,
    startIndex = 0,
    hasMore,
    loadingMore,
    onLoadMore,
    onClose,
    onVideoUpdate,
}) => {
    const containerRef = useRef(null);
    const [activeId, setActiveId] = useState(videos[startIndex]?._id);
    const [commentsFor, setCommentsFor] = useState(null);
    const [isMuted, setIsMuted] = useState(true); // global — shared by every video

    useEffect(() => {
        const el = containerRef.current?.children[startIndex];
        el?.scrollIntoView({ block: 'start' });
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) setActiveId(entry.target.dataset.videoId);
                });
            },
            { root: container, threshold: 0.6 }
        );
        [...container.children].forEach((child) => observer.observe(child));
        return () => observer.disconnect();
    }, [videos.length]);

    const activeIndex = videos.findIndex((v) => v._id === activeId);

    // Infinite scroll: once the user is within 2 videos of the end of what's
    // loaded, fetch the next page — so the next video is ready before they
    // even reach it.
    useEffect(() => {
        if (activeIndex === -1 || !hasMore || loadingMore) return;
        if (activeIndex >= videos.length - 3) {
            onLoadMore?.();
        }
    }, [activeIndex, videos.length, hasMore, loadingMore, onLoadMore]);

    return (
        <div className="fixed inset-0 z-50 bg-black">
            <button
                type="button"
                onClick={onClose}
                className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center"
            >
                <X size={18} className="text-white" />
            </button>

            <div
                ref={containerRef}
                className="w-full h-full overflow-y-scroll snap-y snap-mandatory"
                style={{ scrollBehavior: 'smooth' }}
            >
                {videos.map((v, index) => (
                    <div key={v._id} data-video-id={v._id} className="w-full h-full snap-start">
                        <ReelVideoCard
                            video={v}
                            eventId={eventId}
                            isActive={v._id === activeId}
                            isNearActive={Math.abs(index - activeIndex) <= 1} // active + immediate neighbours only
                            isMuted={isMuted}
                            onToggleMute={() => setIsMuted((m) => !m)}
                            onToggleLike={() => onVideoUpdate.toggleLike(v._id)}
                            onOpenComments={() => setCommentsFor(v)}
                            onSharesCountChange={(count) => onVideoUpdate.shareCount(v._id, count)}
                            onFollowChange={(following, followersCount) =>
                                onVideoUpdate.follow(v.creator?._id, following, followersCount)
                            }
                        />
                    </div>
                ))}

                {/* end-of-feed loader, shown while the next page is fetching */}
                {loadingMore && (
                    <div className="w-full h-24 flex-shrink-0 flex items-center justify-center">
                        <Loader2 size={22} className="text-white animate-spin" />
                    </div>
                )}
            </div>

            {commentsFor && (
                <CommentsPanel
                    video={commentsFor}
                    onClose={() => setCommentsFor(null)}
                    onCommentsCountChange={(count) => onVideoUpdate.commentsCount(commentsFor._id, count)}
                />
            )}
        </div>
    );
};

export default ReelsFeed;