// src/hooks/useFilteredCameraStream.js
import { useRef, useState, useEffect, useCallback } from 'react';

// Same filter presets jo CreatorEditor/CameraCapture mein the — reuse kar rahe hain
export const LIVE_FILTERS = {
    none: 'none',
    warm: 'sepia(0.3) saturate(1.4) brightness(1.05)',
    cool: 'hue-rotate(180deg) saturate(1.2)',
    vintage: 'sepia(0.5) contrast(0.9) brightness(0.9)',
    bw: 'grayscale(1) contrast(1.1)',
    cinematic: 'contrast(1.2) saturate(0.85) brightness(0.9)',
};

// Camera on karta hai, canvas pe filter ke saath draw karta hai, aur canvas ka
// live stream deta hai — yahi stream WebRTC ko bheja jayega (Step 5b).
const useFilteredCameraStream = () => {
    const videoRef = useRef(null);   // hidden — sirf source, khud kabhi dikhta nahi
    const canvasRef = useRef(null);  // yeh wahi hai jo Go-Live screen pe dikhega
    const rawStreamRef = useRef(null); // original camera+mic stream, cleanup ke liye
    const animationFrameRef = useRef(null);

    const [filterKey, setFilterKey] = useState('none');
    const [ready, setReady] = useState(false);
    const [error, setError] = useState('');
    const [facingMode, setFacingMode] = useState('user'); // 'user' = front, 'environment' = back

    const drawLoop = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas && video.readyState >= 2) {
            const ctx = canvas.getContext('2d');
            ctx.filter = LIVE_FILTERS[filterKey] || 'none';
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
        animationFrameRef.current = requestAnimationFrame(drawLoop);
    }, [filterKey]);

    const startCamera = useCallback(async (mode = facingMode) => {
    setError('');
    try {
        rawStreamRef.current?.getTracks().forEach((t) => t.stop());

        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: mode, width: 720, height: 1280 },
            audio: true,
        });
        rawStreamRef.current = stream;

        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
        }
        setReady(true);
    } catch (err) {
        console.error('Camera error:', err.name, err.message);
        if (err.name !== 'AbortError') {
            setError('Camera access denied or unavailable.');
        }
    }
}, [facingMode]);

    useEffect(() => {
        startCamera();
        animationFrameRef.current = requestAnimationFrame(drawLoop);

        return () => {
            cancelAnimationFrame(animationFrameRef.current);
            rawStreamRef.current?.getTracks().forEach((t) => t.stop());
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // filter badalte hi drawLoop ka naya version chahiye (kyunki filterKey closure mein hai)
    useEffect(() => {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = requestAnimationFrame(drawLoop);
    }, [drawLoop]);

    const flipCamera = () => {
        const nextMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(nextMode);
        startCamera(nextMode);
    };

    // yeh function Step 5b mein use hoga — canvas (video) + original mic (audio)
    // dono ko milaake ek combined stream deta hai, jo WebRTC ko bhejenge
    const getOutputStream = useCallback(() => {
        const canvasStream = canvasRef.current?.captureStream(30);
        const audioTrack = rawStreamRef.current?.getAudioTracks()[0];
        if (audioTrack) canvasStream.addTrack(audioTrack);
        return canvasStream;
    }, []);

    return { videoRef, canvasRef, ready, error, filterKey, setFilterKey, flipCamera, getOutputStream };
};

export default useFilteredCameraStream;