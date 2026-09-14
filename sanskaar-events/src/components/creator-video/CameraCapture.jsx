// src/components/creator-video/CameraCapture.jsx
import { useState, useRef, useEffect } from 'react';
import { X, Circle, Square, RotateCcw } from 'lucide-react';
import { FILTER_PRESETS } from './FilterControls';

const MAX_RECORD_SECONDS = 30;

// Opens the camera, shows a live preview with a selectable filter applied
// live (via CSS, same presets as the editor), records via MediaRecorder,
// and hands the final Blob back to the parent as a File — ready to flow
// into CreatorEditor exactly like an uploaded file would.
const CameraCapture = ({ onCapture, onClose }) => {
    const videoRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const streamRef = useRef(null);
    const timerRef = useRef(null);

    const [facingMode, setFacingMode] = useState('user'); // 'user' = front, 'environment' = back
    const [isRecording, setIsRecording] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [selectedFilter, setSelectedFilter] = useState('none');
    const [error, setError] = useState('');

    const startCamera = async (mode) => {
        // Stop any existing stream first (needed when switching front/back)
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: mode },
                audio: true,
            });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
            setError('');
        } catch (err) {
            setError('Could not access camera. Please allow camera permission and try again.');
        }
    };

    useEffect(() => {
        startCamera(facingMode);
        return () => {
            streamRef.current?.getTracks().forEach((t) => t.stop());
            clearInterval(timerRef.current);
        };
    }, [facingMode]);

    const startRecording = () => {
        if (!streamRef.current) return;
        chunksRef.current = [];

        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
            ? 'video/webm;codecs=vp9'
            : 'video/webm';

        const recorder = new MediaRecorder(streamRef.current, { mimeType });
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: mimeType });
            const file = new File([blob], `recording-${Date.now()}.webm`, { type: mimeType });
            onCapture(file, selectedFilter);
        };

        mediaRecorderRef.current = recorder;
        recorder.start();
        setIsRecording(true);
        setElapsed(0);

        timerRef.current = setInterval(() => {
            setElapsed((prev) => {
                const next = prev + 1;
                if (next >= MAX_RECORD_SECONDS) {
                    stopRecording();
                }
                return next;
            });
        }, 1000);
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        clearInterval(timerRef.current);
        setIsRecording(false);
    };

    const activeFilterCss = FILTER_PRESETS.find((f) => f.css === selectedFilter)?.css || 'none';

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-black/60 relative z-10">
                <button
                    type="button"
                    onClick={onClose}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                    <X size={18} className="text-white" />
                </button>

                {isRecording && (
                    <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-white text-xs font-bold">
                            {elapsed}s / {MAX_RECORD_SECONDS}s
                        </span>
                    </div>
                )}

                <button
                    type="button"
                    onClick={() => setFacingMode((m) => (m === 'user' ? 'environment' : 'user'))}
                    disabled={isRecording}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 transition-colors"
                >
                    <RotateCcw size={16} className="text-white" />
                </button>
            </div>

            {/* Live preview */}
            <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
                {error ? (
                    <p className="text-white text-sm px-6 text-center">{error}</p>
                ) : (
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                        style={{
                            filter: activeFilterCss === 'none' ? 'none' : activeFilterCss,
                            transform: facingMode === 'user' ? 'scaleX(-1)' : 'none', // mirror front camera
                        }}
                    />
                )}
            </div>

            {/* Filter strip */}
            {!error && (
                <div className="bg-black/60 px-4 py-3 overflow-x-auto">
                    <div className="flex gap-3">
                        {FILTER_PRESETS.map((f) => (
                            <button
                                key={f.id}
                                type="button"
                                onClick={() => setSelectedFilter(f.css)}
                                className="flex flex-col items-center gap-1 shrink-0"
                            >
                                <div
                                    className={`w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 border-2 transition-all ${selectedFilter === f.css ? 'border-white scale-105' : 'border-transparent'
                                        }`}
                                    style={{ filter: f.css }}
                                />
                                <span className={`text-[10px] font-bold ${selectedFilter === f.css ? 'text-white' : 'text-white/50'}`}>
                                    {f.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Record button */}
            <div className="flex items-center justify-center py-6 bg-black">
                {!error && (
                    <button
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center"
                    >
                        {isRecording ? (
                            <Square size={22} className="text-red-500 fill-red-500" />
                        ) : (
                            <Circle size={48} className="text-red-500 fill-red-500" />
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

export default CameraCapture;