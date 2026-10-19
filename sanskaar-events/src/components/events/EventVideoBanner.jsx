// src/components/events/EventVideoBanner.jsx
import { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

// Hero video: autoplays muted, with the poster as a loading image. Falls back to
// the poster (or a night gradient) if there is no video or it fails to load.
const EventVideoBanner = ({ videoUrl, posterUrl, className = '' }) => {
    const videoRef = useRef(null);
    const [isMuted, setIsMuted] = useState(true);
    const [isPlaying, setIsPlaying] = useState(true);
    const [videoError, setVideoError] = useState(false);

    if (!videoUrl || videoError) {
        return (
            <div
                className={`relative overflow-hidden bg-gradient-to-br from-night via-night-soft to-night ${className}`}
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

            {/* Controls: bottom-right, small */}
            <div className="absolute bottom-3 right-3 z-20 flex gap-2">
                <button
                    type="button"
                    onClick={togglePlay}
                    aria-label={isPlaying ? 'Pause video' : 'Play video'}
                    className="w-11 h-11 rounded-full bg-black/55 hover:bg-black/75 flex items-center justify-center transition-colors"
                >
                    {isPlaying ? <Pause size={17} className="text-white" /> : <Play size={17} className="text-white ml-0.5" />}
                </button>
                <button
                    type="button"
                    onClick={toggleMute}
                    aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                    className="w-11 h-11 rounded-full bg-black/55 hover:bg-black/75 flex items-center justify-center transition-colors"
                >
                    {isMuted ? <VolumeX size={17} className="text-white" /> : <Volume2 size={17} className="text-white" />}
                </button>
            </div>
        </div>
    );
};

export default EventVideoBanner;