// src/components/creator-video/CommunityCreations.jsx
import { useEffect, useState } from 'react';
import { Play, X, Sparkles } from 'lucide-react';
import { creatorVideoService } from '../../services/creatorVideo.service';

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
                        {v.creator?.name && (
                            <span className="absolute bottom-1.5 left-1.5 right-1.5 text-[10px] font-bold text-white truncate drop-shadow">
                                @{v.creator.name}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {activeVideo && (
                <CreatorVideoPlayer video={activeVideo} onClose={() => setActiveVideo(null)} />
            )}
        </div>
    );
};

// Full-screen playback modal — replays trim range in a loop and overlays
// the saved text positions on top, same as the editor preview did.
const CreatorVideoPlayer = ({ video, onClose }) => {
    const handleTimeUpdate = (e) => {
        const v = e.target;
        if (v.currentTime >= video.trimEnd) {
            v.currentTime = video.trimStart;
        }
    };

    const handleLoadedMetadata = (e) => {
        e.target.currentTime = video.trimStart;
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
                        className="w-full h-full object-contain"
                        style={{ filter: video.filterCss === 'none' ? 'none' : video.filterCss }}
                    />

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
            </div>
        </div>
    );
};

export default CommunityCreations;