// src/hooks/useWebRTCBroadcast.js
import { useEffect, useRef } from 'react';
import { getSocket } from '../services/socket';

const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

const useWebRTCBroadcast = (streamId, getOutputStream) => {
    const peersRef = useRef(new Map());

    useEffect(() => {
        if (!streamId) return;
        const socket = getSocket();

        const createPeerForViewer = async (viewerSocketId) => {
            console.log('[HOST] Creating peer for viewer:', viewerSocketId);
            const pc = new RTCPeerConnection(ICE_SERVERS);
            peersRef.current.set(viewerSocketId, pc);

            pc.oniceconnectionstatechange = () => {
                console.log('[HOST] ICE state for', viewerSocketId, ':', pc.iceConnectionState);
            };

            const stream = getOutputStream();
            console.log('[HOST] Output stream tracks:', stream?.getTracks().map((t) => t.kind));
            stream.getTracks().forEach((track) => pc.addTrack(track, stream));

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('[HOST] Sending ICE candidate to', viewerSocketId);
                    socket.emit('webrtc-ice-candidate', { to: viewerSocketId, candidate: event.candidate });
                }
            };

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            console.log('[HOST] Sending offer to', viewerSocketId);
            socket.emit('webrtc-offer', { to: viewerSocketId, offer });
        };

        const handleViewerJoined = ({ viewerSocketId }) => {
            console.log('[HOST] viewer-joined event received:', viewerSocketId);
            createPeerForViewer(viewerSocketId);
        };

        const handleAnswer = async ({ from, answer }) => {
            console.log('[HOST] Answer received from', from);
            const pc = peersRef.current.get(from);
            if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
            else console.warn('[HOST] No peer found for', from);
        };

        const handleIceCandidate = async ({ from, candidate }) => {
            const pc = peersRef.current.get(from);
            if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
        };

        const handleViewerLeft = ({ viewerSocketId }) => {
            peersRef.current.get(viewerSocketId)?.close();
            peersRef.current.delete(viewerSocketId);
        };

        socket.on('viewer-joined', handleViewerJoined);
        socket.on('webrtc-answer', handleAnswer);
        socket.on('webrtc-ice-candidate', handleIceCandidate);
        socket.on('viewer-left', handleViewerLeft);

        return () => {
            socket.off('viewer-joined', handleViewerJoined);
            socket.off('webrtc-answer', handleAnswer);
            socket.off('webrtc-ice-candidate', handleIceCandidate);
            socket.off('viewer-left', handleViewerLeft);
            peersRef.current.forEach((pc) => pc.close());
            peersRef.current.clear();
        };
    }, [streamId, getOutputStream]);
};

export default useWebRTCBroadcast;