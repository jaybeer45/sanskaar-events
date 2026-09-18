// src/components/creator-video/CommunityCreations.jsx
import { useEffect, useState } from 'react';
import { Play, X, Sparkles, Heart, MessageCircle, Send, Share2 } from 'lucide-react';
import { creatorVideoService } from '../../services/creatorVideo.service';
import toast from 'react-hot-toast';
import { authService } from '../../services/auth.service';

// Shows public CreatorVideo entries for this event as a grid of thumbnails.
// Clicking a card opens a full-screen player that replays the same
// trim/filter/text overlay via CSS (see event-video-artist-feature notes —
// Option A, no server-side burned-in export).
const CommunityCreations = ({ eventId }) => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeVideo, setActiveVideo] = useState(null);

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
            setActiveVideo((prev) =>
                prev && prev._id === videoId ? { ...prev, isLiked: liked, likesCount } : prev
            );
        } catch (err) {
            // silently ignore — e.g. guest not logged in; button just won't update
        }
    };

    const handleCommentsCountChange = (videoId, commentsCount) => {
        setVideos((prev) =>
            prev.map((v) => (v._id === videoId ? { ...v, commentsCount } : v))
        );
        setActiveVideo((prev) =>
            prev && prev._id === videoId ? { ...prev, commentsCount } : prev
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
        setActiveVideo((prev) =>
            prev && prev.creator?._id === creatorId
                ? { ...prev, isFollowingCreator: following, creator: { ...prev.creator, followersCount } }
                : prev
        );
    };

    const handleSharesCountChange = (videoId, sharesCount) => {
        setVideos((prev) =>
            prev.map((v) => (v._id === videoId ? { ...v, sharesCount } : v))
        );
        setActiveVideo((prev) =>
            prev && prev._id === videoId ? { ...prev, sharesCount } : prev
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
                {videos.map((v) => (
                    <button
                        key={v._id}
                        type="button"
                        onClick={() => setActiveVideo(v)}
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

            {activeVideo && (
                <CreatorVideoPlayer
                    video={activeVideo}
                    eventId={eventId}
                    onClose={() => setActiveVideo(null)}
                    onToggleLike={() => handleToggleLike(activeVideo._id)}
                    onCommentsCountChange={(count) => handleCommentsCountChange(activeVideo._id, count)}
                    onSharesCountChange={(count) => handleSharesCountChange(activeVideo._id, count)}
                    onFollowChange={(following, followersCount) =>
                        handleFollowChange(activeVideo.creator?._id, following, followersCount)
                    }
                />
            )}
        </div>
    );
};

// Full-screen playback modal — replays trim range in a loop and overlays
// the saved text positions on top, same as the editor preview did.
const CreatorVideoPlayer = ({ video, eventId, onClose, onToggleLike, onCommentsCountChange, onSharesCountChange, onFollowChange }) => {
    const [showComments, setShowComments] = useState(false);

    const handleTimeUpdate = (e) => {
        const v = e.target;
        if (v.currentTime >= video.trimEnd) {
            v.currentTime = video.trimStart;
        }
    };

    const handleLoadedMetadata = (e) => {
        e.target.currentTime = video.trimStart;
    };

    const handleShare = async () => {
        const shareUrl = `${window.location.origin}/events/${eventId}`;

        try {
            if (navigator.share) {
                // Mobile — opens the native share sheet (WhatsApp, Instagram, etc.)
                await navigator.share({ title: 'Check out this video!', url: shareUrl });
            } else {
                // Desktop fallback — no native share sheet, so just copy the link
                await navigator.clipboard.writeText(shareUrl);
                toast.success('Link copied!');
            }
            const res = await creatorVideoService.incrementShare(video._id);
            onSharesCountChange?.(res.data.sharesCount);
        } catch (err) {
            // navigator.share throws if the user cancels the share sheet — not a real error, ignore it
            if (err.name !== 'AbortError') {
                toast.error('Could not share this video.');
            }
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
        <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center px-4"
            onClick={onClose}
        >
            <div className="relative w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute -top-11 right-0 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                    <X size={18} className="text-white" />
                </button>

                <div className="relative aspect-[9/16] bg-black overflow-hidden rounded-xl">
                    <video
                        src={video.videoUrl}
                        autoPlay
                        controls
                        playsInline
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        className="w-full h-full object-cover"
                        style={{ filter: video.filterCss === 'none' ? 'none' : video.filterCss }}
                    />
                    {video.creator?.name && (
                        <div className="absolute top-3 left-3 right-16 flex items-center gap-2 pointer-events-none">
                            <span className="text-sm font-bold text-white drop-shadow truncate">
                                @{video.creator.name}
                            </span>
                            <button
                                type="button"
                                onClick={handleToggleFollow}
                                className={`pointer-events-auto text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 transition-colors ${video.isFollowingCreator
                                    ? 'bg-white/15 text-white'
                                    : 'bg-brand-red text-white'
                                    }`}
                            >
                                {video.isFollowingCreator ? 'Following' : 'Follow'}
                            </button>
                        </div>
                    )}

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
                </div>

                <div className="absolute right-3 bottom-6 z-20 flex flex-col items-center gap-5">

                    {/* LIKE */}
                    <button
                        type="button"
                        onClick={onToggleLike}
                        className="flex flex-col items-center gap-1.5 group"
                    >
                        <span
                            className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 shadow-lg transition-all duration-200 active:scale-90 ${video.isLiked
                                ? 'bg-brand-red'
                                : 'bg-black/40 hover:bg-black/60'
                                }`}
                        >
                            <Heart
                                size={21}
                                strokeWidth={2.3}
                                className={
                                    video.isLiked
                                        ? 'fill-white text-white'
                                        : 'text-white'
                                }
                            />
                        </span>

                        <span className="text-[11px] font-bold text-white drop-shadow-md">
                            {video.likesCount || 0}
                        </span>
                    </button>


                    {/* COMMENT */}
                    <button
                        type="button"
                        onClick={() => setShowComments(true)}
                        className="flex flex-col items-center gap-1.5 group"
                    >
                        <span
                            className="w-12 h-12 rounded-full flex items-center justify-center bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 shadow-lg transition-all duration-200 active:scale-90"
                        >
                            <MessageCircle
                                size={21}
                                strokeWidth={2.3}
                                className="text-white"
                            />
                        </span>

                        <span className="text-[11px] font-bold text-white drop-shadow-md">
                            {video.commentsCount || 0}
                        </span>
                    </button>


                    {/* SHARE */}
                    <button
                        type="button"
                        onClick={handleShare}
                        className="flex flex-col items-center gap-1.5 group"
                    >
                        <span
                            className="w-12 h-12 rounded-full flex items-center justify-center bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 shadow-lg transition-all duration-200 active:scale-90"
                        >
                            <Share2
                                size={20}
                                strokeWidth={2.3}
                                className="text-white"
                            />
                        </span>

                        <span className="text-[11px] font-bold text-white drop-shadow-md">
                            {video.sharesCount || 0}
                        </span>
                    </button>

                </div>

            </div>

            {showComments && (
                <CommentsPanel
                    video={video}
                    onClose={() => setShowComments(false)}
                    onCommentsCountChange={onCommentsCountChange}
                />
            )}
        </div>
    );
};

// Slide-up sheet listing a video's comments, with an input to post a new one.
// Fetches lazily — only when the person actually opens it, not on every video load.
const CommentsPanel = ({ video, onClose, onCommentsCountChange }) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState('');
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        creatorVideoService
            .getComments(video._id)
            .then((res) => setComments(res.data.comments || []))
            .finally(() => setLoading(false));
    }, [video._id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim() || posting) return;

        setPosting(true);
        setError('');
        try {
            const res = await creatorVideoService.addComment(video._id, text.trim());
            setComments((prev) => [res.data.comment, ...prev]);
            onCommentsCountChange?.(res.data.commentsCount);
            setText('');
        } catch (err) {
            setError(err.response?.status === 401 ? 'Login to comment.' : 'Could not post comment.');
        } finally {
            setPosting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[60] bg-black/60 flex items-end justify-center"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm bg-white rounded-t-2xl max-h-[70vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <h3 className="font-bold text-sm text-gray-900">Comments ({video.commentsCount || 0})</h3>
                    <button type="button" onClick={onClose}>
                        <X size={18} className="text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-2">
                    {loading ? (
                        <p className="text-xs text-gray-400 py-4 text-center">Loading comments...</p>
                    ) : comments.length === 0 ? (
                        <p className="text-xs text-gray-400 py-4 text-center">No comments yet. Be the first!</p>
                    ) : (
                        comments.map((c) => (
                            <div key={c._id} className="flex gap-2.5 py-2.5">
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-600 overflow-hidden">
                                    {c.user?.avatar ? (
                                        <img src={c.user.avatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        c.user?.name?.[0]?.toUpperCase() || '?'
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-gray-900">{c.user?.name || 'Someone'}</p>
                                    <p className="text-sm text-gray-700 break-words">{c.text}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-3 border-t border-gray-100">
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Add a comment..."
                        maxLength={300}
                        className="flex-1 text-sm bg-gray-100 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-brand-red/30"
                    />
                    <button
                        type="submit"
                        disabled={!text.trim() || posting}
                        className="w-9 h-9 rounded-full bg-brand-red flex items-center justify-center disabled:opacity-40 flex-shrink-0"
                    >
                        <Send size={15} className="text-white" />
                    </button>
                </form>
                {error && <p className="text-[11px] text-red-500 px-4 pb-2">{error}</p>}
            </div>
        </div>
    );
};

export default CommunityCreations;