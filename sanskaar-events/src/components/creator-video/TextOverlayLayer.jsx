// src/components/creator-video/TextOverlayLayer.jsx
import { useState, useRef } from 'react';

// Renders draggable text elements on top of the video preview. Position is
// stored as percentages (0-100) so it stays correct at any video size —
// important since the final export step will map these same percentages
// onto the canvas dimensions.
const TextOverlayLayer = ({ overlays, onChange, containerRef }) => {
    const [draggingId, setDraggingId] = useState(null);

    const handlePointerDown = (id) => (e) => {
        e.preventDefault();
        setDraggingId(id);
    };

    const handlePointerMove = (e) => {
        if (!draggingId || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
        const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));

        onChange(overlays.map((o) => (o.id === draggingId ? { ...o, x, y } : o)));
    };

    const handlePointerUp = () => setDraggingId(null);

    return (
        <div
            className="absolute inset-0"
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
        >
            {overlays.map((o) => (
                <div
                    key={o.id}
                    onMouseDown={handlePointerDown(o.id)}
                    onTouchStart={handlePointerDown(o.id)}
                    className="absolute cursor-move select-none font-black text-center px-2 whitespace-nowrap"
                    style={{
                        left: `${o.x}%`,
                        top: `${o.y}%`,
                        transform: 'translate(-50%, -50%)',
                        fontSize: `${o.fontSize}px`,
                        color: o.color,
                        textShadow: '0 1px 4px rgba(0,0,0,0.6)',
                    }}
                >
                    {o.content}
                </div>
            ))}
        </div>
    );
};

export default TextOverlayLayer;