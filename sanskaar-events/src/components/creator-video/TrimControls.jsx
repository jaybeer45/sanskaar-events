// src/components/creator-video/TrimControls.jsx
import { useState, useEffect } from 'react';
import { Scissors } from 'lucide-react';

const MAX_CLIP_SECONDS = 30;

const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

// Dual-range trim slider. Enforces the 30-second max clip length by
// clamping the end handle whenever the start handle moves past it (and
// vice versa) — parent just receives the final {start, end} via onChange.
const TrimControls = ({ duration, trimRange, onChange, videoRef }) => {
    const [start, setStart] = useState(trimRange.start);
    const [end, setEnd] = useState(trimRange.end);

    useEffect(() => {
        setStart(trimRange.start);
        setEnd(trimRange.end);
    }, [trimRange.start, trimRange.end]);

    const handleStartChange = (value) => {
        const newStart = Math.min(value, end - 1);
        const clampedEnd = Math.min(end, newStart + MAX_CLIP_SECONDS);
        setStart(newStart);
        setEnd(clampedEnd);
        onChange({ start: newStart, end: clampedEnd });
        if (videoRef?.current) videoRef.current.currentTime = newStart;
    };

    const handleEndChange = (value) => {
        const newEnd = Math.max(value, start + 1);
        const clampedStart = Math.max(start, newEnd - MAX_CLIP_SECONDS);
        setEnd(newEnd);
        setStart(clampedStart);
        onChange({ start: clampedStart, end: newEnd });
    };

    const clipLength = end - start;
    const isOverLimit = clipLength > MAX_CLIP_SECONDS;

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Scissors size={15} className="text-brand-red" />
                    <p className="text-sm font-bold text-gray-900">Trim your clip</p>
                </div>
                <span className={`text-xs font-bold ${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}>
                    {formatTime(clipLength)} / {formatTime(MAX_CLIP_SECONDS)}
                </span>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1.5 block">
                        Start — {formatTime(start)}
                    </label>
                    <input
                        type="range"
                        min={0}
                        max={duration}
                        step={0.1}
                        value={start}
                        onChange={(e) => handleStartChange(Number(e.target.value))}
                        className="w-full accent-brand-red"
                    />
                </div>

                <div>
                    <label className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1.5 block">
                        End — {formatTime(end)}
                    </label>
                    <input
                        type="range"
                        min={0}
                        max={duration}
                        step={0.1}
                        value={end}
                        onChange={(e) => handleEndChange(Number(e.target.value))}
                        className="w-full accent-brand-red"
                    />
                </div>
            </div>

            <p className="text-xs text-gray-400 mt-3">
                Max clip length is {MAX_CLIP_SECONDS} seconds — dragging past the limit moves the other handle automatically.
            </p>
        </div>
    );
};

export default TrimControls;