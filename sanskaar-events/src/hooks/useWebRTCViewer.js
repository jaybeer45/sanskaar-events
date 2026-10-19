// src/hooks/useWebRTCViewer.js
import { useEffect, useRef, useState } from 'react';
import { getSocket } from '../services/socket';

const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

const useWebRTCViewer = (streamId) => {
    const pcRef = useRef(null);
    const [remoteStream, setRemoteStream] = useState(null);

    useEffect(() => {
        if (!streamId) return;
        const socket = getSocket();

        const handleOffer = async ({ from, offer }) => {
            console.log('[VIEWER] Offer received from host:', from);
            const pc = new RTCPeerConnection(ICE_SERVERS);
            pcRef.current = pc;

            pc.oniceconnectionstatechange = () => {
                console.log('[VIEWER] ICE state:', pc.iceConnectionState);
            };

            pc.ontrack = (event) => {
                console.log('[VIEWER] Track received:', event.track.kind);
                setRemoteStream(event.streams[0]);
            };

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('[VIEWER] Sending ICE candidate to host');
                    socket.emit('webrtc-ice-candidate', { to: from, candidate: event.candidate });
                }
            };

            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            console.log('[VIEWER] Sending answer to host');
            socket.emit('webrtc-answer', { to: from, answer });
        };

        const handleIceCandidate = async ({ candidate }) => {
            if (pcRef.current) await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        };

        socket.on('webrtc-offer', handleOffer);
        socket.on('webrtc-ice-candidate', handleIceCandidate);

        return () => {
            socket.off('webrtc-offer', handleOffer);
            socket.off('webrtc-ice-candidate', handleIceCandidate);
            pcRef.current?.close();
            pcRef.current = null;
        };
    }, [streamId]);

    return remoteStream;
};

export default useWebRTCViewer;