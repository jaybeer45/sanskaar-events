// src/hooks/useLiveStream.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../services/socket';

// role: 'host' | 'viewer'
// Saara live-related real-time state (chat, hearts, viewer count, connection
// status) ek jagah — Go-Live page aur Viewer page dono isi hook ko use karte hain.
const useLiveStream = (streamId, role) => {
    const socketRef = useRef(null);
    const [connected, setConnected] = useState(false);
    const [viewerCount, setViewerCount] = useState(0);
    const [heartsCount, setHeartsCount] = useState(0);
    const [messages, setMessages] = useState([]);
    const [hostLeft, setHostLeft] = useState(false);

    useEffect(() => {
        if (!streamId) return;

        const socket = getSocket();
        socketRef.current = socket;

        const doJoin = () => {
            setConnected(true);
            socket.emit('join-live', { streamId, role });
        };

        // Agar socket PEHLE SE hi connected hai (jaise pichli baar ki testing
        // se), turant join-live bhejo — 'connect' event ka wait mat karo,
        // wo dubara fire nahi hoga kyunki connection already ban chuka hai
        if (socket.connected) {
            doJoin();
        } else {
            socket.connect();
        }

        socket.on('connect', doJoin);
        socket.on('viewer-count', ({ count }) => setViewerCount(count));
        socket.on('live-heart', ({ heartsCount }) => setHeartsCount(heartsCount));
        socket.on('live-chat-message', (msg) => setMessages((prev) => [...prev, msg]));
        socket.on('live-host-left', () => setHostLeft(true));

        return () => {
            socket.emit('leave-live');
            socket.off('connect', doJoin);
            socket.off('viewer-count');
            socket.off('live-heart');
            socket.off('live-chat-message');
            socket.off('live-host-left');
            // socket.disconnect() yahan JAANBUJH KAR nahi kiya — agla page
            // (Go-Live → Viewer, ya vice versa) usi connection ko reuse karega
        };
    }, [streamId, role]);

    const sendMessage = useCallback((text) => {
        socketRef.current?.emit('live-chat-message', { streamId, text });
    }, [streamId]);

    const sendHeart = useCallback(() => {
        socketRef.current?.emit('live-heart', { streamId });
    }, [streamId]);

    return { connected, viewerCount, heartsCount, messages, hostLeft, sendMessage, sendHeart };
};

export default useLiveStream;