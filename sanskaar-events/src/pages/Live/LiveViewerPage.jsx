// src/pages/Live/LiveViewerPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Heart, Users } from 'lucide-react';
import useLiveStream from '../../hooks/useLiveStream';
import useWebRTCViewer from '../../hooks/useWebRTCViewer';

const LiveViewerPage = () => {
    const { streamId } = useParams();
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const [chatText, setChatText] = useState('');
    const [floatingHearts, setFloatingHearts] = useState([]);

    const { connected, viewerCount, messages, hostLeft, sendMessage, sendHeart } = useLiveStream(streamId, 'viewer');
    const remoteStream = useWebRTCViewer(streamId);

    useEffect(() => {
        if (videoRef.current && remoteStream) {
            videoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    const handleHeartTap = () => {
        sendHeart();
        const id = Date.now();
        setFloatingHearts((prev) => [...prev, id]);
        setTimeout(() => setFloatingHearts((prev) => prev.filter((h) => h !== id)), 1500);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!chatText.trim()) return;
        sendMessage(chatText.trim());
        setChatText('');
    };

    if (hostLeft) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center px-6">
                <div className="text-center text-white">
                    <h2 className="font-black text-xl mb-6">Live ended</h2>
                    <button type="button" onClick={() => navigate(-1)} className="bg-brand-red text-white font-bold px-6 py-2.5 rounded-full text-sm">
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />

            {!remoteStream && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <p className="text-white text-sm">{connected ? 'Connecting to live...' : 'Connecting...'}</p>
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
                </div>
                <button type="button" onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
                    <X size={16} className="text-white" />
                </button>
            </div>

            <div className="absolute bottom-16 right-4 w-10 h-40 pointer-events-none">
                {floatingHearts.map((id) => (
                    <Heart key={id} size={22} className="absolute right-0 bottom-0 text-brand-red fill-brand-red animate-ping" />
                ))}
            </div>

            <div className="absolute bottom-16 left-3 right-16 max-h-40 overflow-y-auto flex flex-col gap-1.5">
                {messages.slice(-20).map((m, i) => (
                    <p key={i} className="text-xs text-white bg-black/30 inline-block px-2.5 py-1 rounded-full w-fit max-w-full">
                        <span className="font-bold">{m.user.name}</span> {m.text}
                    </p>
                ))}
            </div>

            <button type="button" onClick={handleHeartTap} className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center">
                <Heart size={18} className="text-white" />
            </button>

            <form onSubmit={handleSendMessage} className="absolute bottom-3 left-3 right-16">
                <input
                    type="text"
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    placeholder={connected ? 'Say something...' : 'Connecting...'}
                    disabled={!connected}
                    maxLength={200}
                    className="w-full text-sm bg-white/15 text-white placeholder-white/60 rounded-full px-4 py-2 outline-none"
                />
            </form>
        </div>
    );
};

export default LiveViewerPage;