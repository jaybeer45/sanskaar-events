// src/pages/Profile/MyCreatorVideosPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChevronLeft, Play, Eye, Heart, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { creatorVideoService } from '../../services/creatorVideo.service';
import { authService } from '../../services/auth.service';
import { ROUTES } from '../../constants/routes';
import Spinner from '../../components/ui/Spinner/Spinner';
import ProfileHeader from '../../components/creator-video/ProfileHeader';
import FollowListModal from '../../components/creator-video/FollowListModal';
import ReelsFeed from '../../components/creator-video/ReelsFeed';

const MyCreatorVideosPage = () => {
    const user = useSelector((s) => s.auth.user);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [activeModal, setActiveModal] = useState(null); // 'followers' | 'following' | null
    const [feedStartIndex, setFeedStartIndex] = useState(null); // null = feed closed

    useEffect(() => {
        creatorVideoService
            .getMine()
            .then((res) => setVideos(res.data.results || []))
            .finally(() => setLoading(false));
    }, []);

    const patchVideo = (videoId, patch) =>
        setVideos((prev) => prev.map((v) => (v._id === videoId ? { ...v, ...patch } : v)));

    const handleToggleLike = async (videoId) => {
        try {
            const res = await creatorVideoService.toggleLike(videoId);
            patchVideo(videoId, { isLiked: res.data.liked, likesCount: res.data.likesCount });
        } catch (err) {
            // ignored
        }
    };

    const handleDelete = async (video) => {
        if (!window.confirm('Delete this video? This cannot be undone.')) return;

        setDeletingId(video._id);
        try {
            await creatorVideoService.delete(video._id);
            setVideos((prev) => prev.filter((v) => v._id !== video._id));
            toast.success('Video deleted.');
        } catch (err) {
            toast.error('Could not delete this video.');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="min-h-screen">
            <div className="border-b border-mist bg-white">
                <div className="mx-auto max-w-3xl px-4 py-3 sm:px-6">
                    <Link
                        to={ROUTES.PROFILE}
                        className="inline-flex items-center gap-1 text-sm text-ink/60 transition-colors hover:text-night"
                    >
                        <ChevronLeft size={16} /> Back to profile
                    </Link>
                </div>
            </div>

            <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
                <ProfileHeader
                    name={user?.name || 'Creator'}
                    avatar={user?.avatar}
                    stats={[
                        { label: 'Videos', value: videos.length, href: '#my-videos-grid' },
                        { label: 'Followers', value: user?.followersCount ?? 0, onClick: () => setActiveModal('followers') },
                        { label: 'Following', value: user?.followingCount ?? 0, onClick: () => setActiveModal('following') },
                    ]}
                />

                <div className="mt-8">
                    {loading ? (
                        <div className="flex justify-center py-16">
                            <Spinner size="lg" />
                        </div>
                    ) : videos.length === 0 ? (
                        <div className="card px-6 py-12 text-center">
                            <p className="font-heading text-lg font-semibold text-night">No videos yet</p>
                            <p className="mt-1 text-sm text-ink/60">Open any event and tap Create video to make your first one.</p>
                            <Link to={ROUTES.HOME} className="btn-brand mt-5 inline-block">Browse events</Link>
                        </div>
                    ) : (
                        <div id="my-videos-grid" className="grid scroll-mt-24 grid-cols-3 gap-1.5">
                            {videos.map((v, index) => (
                                <div
                                    key={v._id}
                                    onClick={() => setFeedStartIndex(index)}
                                    className="relative aspect-[9/16] cursor-pointer overflow-hidden rounded-xl bg-night"
                                >
                                    <video
                                        src={v.videoUrl}
                                        className="pointer-events-none h-full w-full object-cover"
                                        style={{ filter: v.filterCss === 'none' ? 'none' : v.filterCss }}
                                        muted
                                        playsInline
                                        preload="metadata"
                                    />
                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90">
                                            <Play size={13} className="ml-0.5 text-night" />
                                        </div>
                                    </div>

                                    <span className="absolute left-1.5 top-1.5 rounded-pill bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white">
                                        {v.visibility === 'public' ? 'Public' : 'Private'}
                                    </span>

                                    <button
                                        type="button"
                                        aria-label="Delete video"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(v);
                                        }}
                                        disabled={deletingId === v._id}
                                        className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 disabled:opacity-50"
                                    >
                                        <Trash2 size={14} className="text-white" />
                                    </button>

                                    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-5 text-xs font-semibold text-white">
                                        <span className="flex items-center gap-1"><Eye size={12} /> {v.viewsCount || 0}</span>
                                        <span className="flex items-center gap-1"><Heart size={12} /> {v.likesCount || 0}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {activeModal === 'followers' && (
                <FollowListModal
                    title="Followers"
                    fetchFn={() => authService.getFollowers(user._id)}
                    onClose={() => setActiveModal(null)}
                />
            )}
            {activeModal === 'following' && (
                <FollowListModal
                    title="Following"
                    fetchFn={() => authService.getFollowing(user._id)}
                    onClose={() => setActiveModal(null)}
                />
            )}

            {feedStartIndex !== null && (
                <ReelsFeed
                    videos={videos}
                    startIndex={feedStartIndex}
                    hasMore={false}
                    loadingMore={false}
                    onLoadMore={() => { }}
                    onClose={() => setFeedStartIndex(null)}
                    onVideoUpdate={{
                        toggleLike: handleToggleLike,
                        commentsCount: (id, c) => patchVideo(id, { commentsCount: c }),
                        shareCount: (id, c) => patchVideo(id, { sharesCount: c }),
                        follow: () => { },
                    }}
                />
            )}
        </div>
    );
};

export default MyCreatorVideosPage;