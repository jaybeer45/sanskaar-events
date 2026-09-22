// src/components/creator-video/ReelsFeed.jsx
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import ReelVideoCard from './ReelVideoCard';
import CommentsPanel from './CommentsPanel'; // existing component — export it separately, see note below

const ReelsFeed = ({ videos, eventId, startIndex = 0, onClose, onVideoUpdate }) => {
    const containerRef = useRef(null);
    const [activeId, setActiveId] = useState(videos[startIndex]?._id);
    const [commentsFor, setCommentsFor] = useState(null);

    // Scroll to the video the user actually clicked on, on open
    useEffect(() => {
        const el = containerRef.current?.children[startIndex];
        el?.scrollIntoView({ block: 'start' });
    }, []);

    // Watch which card is >=60% visible → that's the "active" (playing) one
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
                {videos.map((v) => (
                    <div key={v._id} data-video-id={v._id} className="w-full h-full snap-start">
                        <ReelVideoCard
                            video={v}
                            eventId={eventId}
                            isActive={v._id === activeId}
                            onToggleLike={() => onVideoUpdate.toggleLike(v._id)}
                            onOpenComments={() => setCommentsFor(v)}
                            onSharesCountChange={(count) => onVideoUpdate.shareCount(v._id, count)}
                            onFollowChange={(following, followersCount) =>
                                onVideoUpdate.follow(v.creator?._id, following, followersCount)
                            }
                        />
                    </div>
                ))}
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