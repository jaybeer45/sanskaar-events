// src/pages/Live/GoLivePage.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, RotateCcw, Heart, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import useFilteredCameraStream, { LIVE_FILTERS } from '../../hooks/useFilteredCameraStream';
import useLiveStream from '../../hooks/useLiveStream';
import useWebRTCBroadcast from '../../hooks/useWebRTCBroadcast';
import { liveStreamService } from '../../services/liveStream.service';

export const FILTER_LABELS = { none: 'Normal', warm: 'Warm', cool: 'Cool', vintage: 'Vintage', bw: 'B&W', cinematic: 'Cinematic' };

const GoLivePage = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();

    const { videoRef, canvasRef, ready, error: cameraError, filterKey, setFilterKey, flipCamera, getOutputStream } = useFilteredCameraStream();

    const [streamId, setStreamId] = useState(null);
    const [starting, setStarting] = useState(true);
    const [ended, setEnded] = useState(null); // { peakViewers, heartsCount } | null
    const [chatText, setChatText] = useState('');
    const peakViewersRef = useRef(0);

    // Backend mein LiveStream record banao jaise hi page khule
    useEffect(() => {
        liveStreamService
            .start(eventId, '', 'none')
            .then((res) => setStreamId(res.data.stream._id))
            .catch(() => toast.error('Could not start live stream.'))
            .finally(() => setStarting(false));
    }, [eventId]);

    const { connected, viewerCount, heartsCount, messages, sendMessage } = useLiveStream(streamId, 'host');
    useWebRTCBroadcast(streamId, getOutputStream);

    useEffect(() => {
        if (viewerCount > peakViewersRef.current) peakViewersRef.current = viewerCount;
    }, [viewerCount]);

    const handleEndLive = async () => {
        if (!streamId) return;
        try {
            await liveStreamService.end(streamId, peakViewersRef.current, heartsCount);
        } catch (err) {
            // stats save na bhi ho, live to band karna hi hai
        }
        setEnded({ peakViewers: peakViewersRef.current, heartsCount });
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!chatText.trim()) return;
        sendMessage(chatText.trim());
        setChatText('');
    };

    if (ended) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center px-6">
                <div className="text-center text-white">
                    <h2 className="font-black text-2xl mb-6">Live ended</h2>
                    <div className="flex items-center justify-center gap-10 mb-8">
                        <div>
                            <p className="font-black text-2xl">{ended.peakViewers}</p>
                            <p className="text-xs text-gray-400">Peak viewers</p>
                        </div>
                        <div>
                            <p className="font-black text-2xl">{ended.heartsCount}</p>
                            <p className="text-xs text-gray-400">Hearts</p>
                        </div>
                    </div>
                    <button type="button" onClick={() => navigate(-1)} className="bg-brand-red text-white font-bold px-6 py-2.5 rounded-full text-sm">
                        Done
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black">
            <video ref={videoRef} className="hidden" muted playsInline />
            <canvas ref={canvasRef} width={720} height={1280} className="w-full h-full object-cover" />

            {(starting || !ready) && !cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <p className="text-white text-sm">{starting ? 'Starting live...' : 'Starting camera...'}</p>
                </div>
            )}
            {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center px-6">
                    <p className="text-red-400 text-sm text-center">{cameraError}</p>
                </div>
            )}

            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="bg-brand-red text-white text-[10px] font-black px-2 py-1 rounded uppercase flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
                    </span>
                    <span className="bg-black/40 text-white text-[11px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <Users size={11} /> {viewerCount}
                    </span>
                    <span className="bg-black/40 text-white text-[11px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <Heart size={11} className="fill-white" /> {heartsCount}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={flipCamera} className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
                        <RotateCcw size={14} className="text-white" />
                    </button>
                    <button type="button" onClick={handleEndLive} className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
                        <X size={16} className="text-white" />
                    </button>
                </div>
            </div>

            <div className="absolute bottom-32 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto">
                {Object.keys(LIVE_FILTERS).map((key) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setFilterKey(key)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0 ${filterKey === key ? 'bg-white text-black' : 'bg-black/40 text-white'}`}
                    >
                        {FILTER_LABELS[key]}
                    </button>
                ))}
            </div>

            <div className="absolute bottom-16 left-3 right-20 max-h-40 overflow-y-auto flex flex-col gap-1.5">
                {messages.slice(-20).map((m, i) => (
                    <p key={i} className="text-xs text-white bg-black/30 inline-block px-2.5 py-1 rounded-full w-fit max-w-full">
                        <span className="font-bold">{m.user.name}</span> {m.text}
                    </p>
                ))}
            </div>

            <form onSubmit={handleSendMessage} className="absolute bottom-0 left-0 right-0 flex items-center gap-2 px-3 py-3 bg-gradient-to-t from-black/70 to-transparent">
                <input
                    type="text"
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    placeholder={connected ? 'Say something...' : 'Connecting...'}
                    disabled={!connected}
                    maxLength={200}
                    className="flex-1 text-sm bg-white/15 text-white placeholder-white/60 rounded-full px-4 py-2 outline-none"
                />
            </form>
        </div>
    );
};

export default GoLivePage;