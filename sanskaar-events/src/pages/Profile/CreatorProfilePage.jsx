// src/pages/Profile/CreatorProfilePage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChevronLeft, Play, Eye, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { creatorVideoService } from '../../services/creatorVideo.service';
import { authService } from '../../services/auth.service';
import Spinner from '../../components/ui/Spinner/Spinner';
import ProfileHeader from '../../components/creator-video/ProfileHeader';
import FollowListModal from '../../components/creator-video/FollowListModal';
import ReelsFeed from '../../components/creator-video/ReelsFeed';

// Public profile of any creator: their info, public videos and a follow button
const CreatorProfilePage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const currentUser = useSelector((s) => s.auth.user);

    const [profile, setProfile] = useState(null);
    const [videos, setVideos] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [feedStartIndex, setFeedStartIndex] = useState(null);
    const [activeModal, setActiveModal] = useState(null); // 'followers' | 'following' | null

    useEffect(() => {
        setLoading(true);
        setActiveModal(null);
        setFeedStartIndex(null);
        Promise.all([authService.getUserById(userId), creatorVideoService.getByUser(userId)])
            .then(([userRes, videosRes]) => {
                setProfile(userRes.data);
                setVideos(videosRes.data.results || []);
                setIsFollowing(!!videosRes.data.isFollowing);
            })
            .catch(() => setProfile(null))
            .finally(() => setLoading(false));
    }, [userId]);

    const patchVideo = (videoId, patch) =>
        setVideos((prev) => prev.map((v) => (v._id === videoId ? { ...v, ...patch } : v)));

    const applyFollow = (following, followersCount) => {
        setIsFollowing(following);
        setProfile((p) => ({ ...p, followersCount }));
        setVideos((prev) => prev.map((v) => ({ ...v, isFollowingCreator: following })));
    };

    const handleToggleFollow = async () => {
        try {
            const res = await authService.toggleFollow(userId);
            applyFollow(res.data.following, res.data.followersCount);
        } catch (err) {
            toast.error(err.response?.status === 401 ? 'Log in to follow creators.' : 'Could not update follow.');
        }
    };

    const handleToggleLike = async (videoId) => {
        try {
            const res = await creatorVideoService.toggleLike(videoId);
            patchVideo(videoId, { isLiked: res.data.liked, likesCount: res.data.likesCount });
        } catch (err) {
            // ignored
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }
    if (!profile) {
        return <div className="py-16 text-center text-sm text-ink/60">This user could not be found.</div>;
    }

    const isOwnProfile = currentUser?._id === userId;

    return (
        <div className="min-h-screen">
            <div className="border-b border-mist bg-white">
                <div className="mx-auto max-w-3xl px-4 py-3 sm:px-6">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-1 text-sm text-ink/60 transition-colors hover:text-night"
                    >
                        <ChevronLeft size={16} /> Back
                    </button>
                </div>
            </div>

            <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
                <ProfileHeader
                    name={profile.name}
                    avatar={profile.avatar}
                    stats={[
                        { label: 'Videos', value: videos.length, href: '#creator-videos-grid' },
                        { label: 'Followers', value: profile.followersCount ?? 0, onClick: () => setActiveModal('followers') },
                        { label: 'Following', value: profile.followingCount ?? 0, onClick: () => setActiveModal('following') },
                    ]}
                >
                    {!isOwnProfile && (
                        <button
                            type="button"
                            onClick={handleToggleFollow}
                            aria-pressed={isFollowing}
                            className={`h-10 rounded-pill px-6 text-sm font-semibold transition-colors ${isFollowing ? 'bg-night/10 text-night hover:bg-night/15' : 'bg-brand-red text-white hover:bg-brand-red-hover'
                                }`}
                        >
                            {isFollowing ? 'Following' : 'Follow'}
                        </button>
                    )}
                </ProfileHeader>

                <div className="mt-8">
                    {videos.length === 0 ? (
                        <div className="card px-6 py-12 text-center">
                            <p className="font-heading text-lg font-semibold text-night">No public videos yet</p>
                        </div>
                    ) : (
                        <div id="creator-videos-grid" className="grid scroll-mt-24 grid-cols-3 gap-1.5">
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
                <FollowListModal title="Followers" fetchFn={() => authService.getFollowers(userId)} onClose={() => setActiveModal(null)} />
            )}
            {activeModal === 'following' && (
                <FollowListModal title="Following" fetchFn={() => authService.getFollowing(userId)} onClose={() => setActiveModal(null)} />
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
                        follow: (creatorId, following, followersCount) => applyFollow(following, followersCount),
                    }}
                />
            )}
        </div>
    );
};

export default CreatorProfilePage;