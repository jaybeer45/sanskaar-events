// src/components/events/EventVideoBanner.jsx
import { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

// BookMyShow-style hero: video autoplays muted with poster as fallback/loading
// image. Falls back to a plain image if the event has no promotional video.
const EventVideoBanner = ({ videoUrl, posterUrl, className = '' }) => {
    const videoRef = useRef(null);
    const [isMuted, setIsMuted] = useState(true);
    const [isPlaying, setIsPlaying] = useState(true);
    const [videoError, setVideoError] = useState(false);

    if (!videoUrl || videoError) {
        // No video, or it failed to load — just show the poster/thumbnail image
        return (
            <div
                className={`relative overflow-hidden ${className}`}
                style={{
                    backgroundImage: posterUrl ? undefined : 'repeating-linear-gradient(135deg, #d1d5db 0, #d1d5db 1px, #e5e7eb 1px, #e5e7eb 10px)',
                    backgroundColor: '#e5e7eb',
                }}
            >
                {posterUrl && <img src={posterUrl} alt="" className="w-full h-full object-cover" />}
            </div>
        );
    }

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const toggleMute = () => {
        if (!videoRef.current) return;
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    return (
        <div className={`relative overflow-hidden bg-black ${className}`}>
            <video
                ref={videoRef}
                src={videoUrl}
                poster={posterUrl}
                autoPlay
                muted
                loop
                playsInline
                onError={() => setVideoError(true)}
                className="w-full h-full object-cover"
            />

            {/* Controls overlay — bottom-right, small, unobtrusive */}
            <div className="absolute bottom-3 right-3 flex gap-2">
                <button
                    type="button"
                    onClick={togglePlay}
                    className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
                >
                    {isPlaying ? <Pause size={15} className="text-white" /> : <Play size={15} className="text-white ml-0.5" />}
                </button>
                <button
                    type="button"
                    onClick={toggleMute}
                    className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
                >
                    {isMuted ? <VolumeX size={15} className="text-white" /> : <Volume2 size={15} className="text-white" />}
                </button>
            </div>
        </div>
    );
};

export default EventVideoBanner;