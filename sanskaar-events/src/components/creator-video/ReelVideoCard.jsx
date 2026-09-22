// src/components/creator-video/ReelVideoCard.jsx
import { useEffect, useRef, useState } from 'react';
import { Heart, MessageCircle, Share2, Volume2, VolumeX } from 'lucide-react';
import { creatorVideoService } from '../../services/creatorVideo.service';
import toast from 'react-hot-toast';
import { authService } from '../../services/auth.service';

// One full-screen video "page" inside the Reels feed.
// isActive = true when this card is the one currently in view (controls
// play/pause + view-count tracking so we don't double count every card).
const ReelVideoCard = ({
    video,
    eventId,
    isActive,
    onToggleLike,
    onOpenComments,
    onSharesCountChange,
    onFollowChange,
}) => {
    const videoRef = useRef(null);
    const [isMuted, setIsMuted] = useState(true); // start muted — browsers block unmuted autoplay
    const [showHeart, setShowHeart] = useState(false);
    const lastTapRef = useRef(0);
    const viewCountedRef = useRef(false);

    // Play/pause based on whether this card is the active one in the feed
    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        if (isActive) {
            v.currentTime = video.trimStart;
            v.play().catch(() => { }); // ignore autoplay-block errors
        } else {
            v.pause();
            viewCountedRef.current = false; // reset so scrolling back counts again
        }
    }, [isActive]);

    const handleTimeUpdate = (e) => {
        const v = e.target;
        if (v.currentTime >= video.trimEnd) {
            v.currentTime = video.trimStart;
        }
        // Count a "view" once this card has actually played ~2 seconds
        if (!viewCountedRef.current && v.currentTime - video.trimStart > 2) {
            viewCountedRef.current = true;
            creatorVideoService.incrementView(video._id).catch(() => { });
        }
    };

    const handleDoubleTap = () => {
        const now = Date.now();
        if (now - lastTapRef.current < 300) {
            if (!video.isLiked) onToggleLike(); // double-tap only LIKES, never unlikes
            setShowHeart(true);
            setTimeout(() => setShowHeart(false), 700);
        }
        lastTapRef.current = now;
    };

    const handleShare = async () => {
        const shareUrl = `${window.location.origin}/events/${eventId}`;
        try {
            if (navigator.share) {
                await navigator.share({ title: 'Check out this video!', url: shareUrl });
            } else {
                await navigator.clipboard.writeText(shareUrl);
                toast.success('Link copied!');
            }
            const res = await creatorVideoService.incrementShare(video._id);
            onSharesCountChange?.(res.data.sharesCount);
        } catch (err) {
            if (err.name !== 'AbortError') toast.error('Could not share this video.');
        }
    };

    const handleToggleFollow = async () => {
        if (!video.creator?._id) return;
        try {
            const res = await authService.toggleFollow(video.creator._id);
            onFollowChange?.(res.data.following, res.data.followersCount);
        } catch (err) {
            toast.error(err.response?.status === 401 ? 'Login to follow creators.' : 'Could not update follow.');
        }
    };

    return (
        <div className="relative w-full h-full snap-start flex-shrink-0 bg-black">
            <video
                ref={videoRef}
                src={video.videoUrl}
                muted={isMuted}
                loop={false}
                playsInline
                onTimeUpdate={handleTimeUpdate}
                onClick={handleDoubleTap}
                className="w-full h-full object-cover"
                style={{ filter: video.filterCss === 'none' ? 'none' : video.filterCss }}
            />

            {/* double-tap heart animation */}
            {showHeart && (
                <Heart
                    size={90}
                    className="absolute inset-0 m-auto text-white fill-brand-red animate-ping pointer-events-none"
                />
            )}

            {/* mute/unmute button */}
            <button
                type="button"
                onClick={() => setIsMuted((m) => !m)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center"
            >
                {isMuted ? <VolumeX size={16} className="text-white" /> : <Volume2 size={16} className="text-white" />}
            </button>

            {/* text overlays */}
            {video.textOverlays?.map((o, i) => (
                <p
                    key={i}
                    className="absolute font-black text-center px-2 whitespace-nowrap pointer-events-none"
                    style={{
                        left: `${o.x}%`,
                        top: `${o.y}%`,
                        transform: 'translate(-50%, -50%)',
                        fontSize: `${o.fontSize}px`,
                        color: o.color,
                        textShadow: '0 1px 4px rgba(0,0,0,0.6)',
                    }}
                >
                    {o.content}
                </p>
            ))}

            {/* creator name + follow */}
            {video.creator?.name && (
                <div className="absolute bottom-24 left-3 right-16 flex items-center gap-2">
                    <span className="text-sm font-bold text-white drop-shadow truncate">
                        @{video.creator.name}
                    </span>
                    <button
                        type="button"
                        onClick={handleToggleFollow}
                        className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${video.isFollowingCreator ? 'bg-white/15 text-white' : 'bg-brand-red text-white'
                            }`}
                    >
                        {video.isFollowingCreator ? 'Following' : 'Follow'}
                    </button>
                </div>
            )}

            {/* right-side action rail */}
            <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5">
                <button type="button" onClick={onToggleLike} className="flex flex-col items-center gap-1.5">
                    <span className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 ${video.isLiked ? 'bg-brand-red' : 'bg-black/40'}`}>
                        <Heart size={21} className={video.isLiked ? 'fill-white text-white' : 'text-white'} />
                    </span>
                    <span className="text-[11px] font-bold text-white drop-shadow-md">{video.likesCount || 0}</span>
                </button>

                <button type="button" onClick={onOpenComments} className="flex flex-col items-center gap-1.5">
                    <span className="w-12 h-12 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/20">
                        <MessageCircle size={21} className="text-white" />
                    </span>
                    <span className="text-[11px] font-bold text-white drop-shadow-md">{video.commentsCount || 0}</span>
                </button>

                <button type="button" onClick={handleShare} className="flex flex-col items-center gap-1.5">
                    <span className="w-12 h-12 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/20">
                        <Share2 size={20} className="text-white" />
                    </span>
                    <span className="text-[11px] font-bold text-white drop-shadow-md">{video.sharesCount || 0}</span>
                </button>
            </div>

            {/* view count, bottom-left, small */}
            <span className="absolute bottom-4 left-3 text-[11px] font-semibold text-white/80">
                {video.viewsCount || 0} views
            </span>
        </div>
    );
};

export default ReelVideoCard;