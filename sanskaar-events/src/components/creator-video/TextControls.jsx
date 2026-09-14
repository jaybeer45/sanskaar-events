// src/components/creator-video/TextControls.jsx
import { Type, Trash2, Sparkles } from 'lucide-react';

let overlayIdCounter = 0;
const makeOverlay = (content) => ({
    id: `overlay-${Date.now()}-${overlayIdCounter++}`,
    content,
    x: 50,
    y: 50,
    fontSize: 24,
    color: '#ffffff',
});

const TextControls = ({ overlays, onChange, event }) => {
    const addText = () => {
        onChange([...overlays, makeOverlay('Your text here')]);
    };

    const addEventInfo = () => {
        const dateStr = event?.date ? new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';
        const infoLine = [event?.title, dateStr, event?.venue?.name].filter(Boolean).join(' · ');
        onChange([...overlays, makeOverlay(infoLine || 'Event info')]);
    };

    const updateContent = (id, content) => {
        onChange(overlays.map((o) => (o.id === id ? { ...o, content } : o)));
    };

    const removeOverlay = (id) => {
        onChange(overlays.filter((o) => o.id !== id));
    };

    return (
        <div>
            <div className="flex items-center gap-2 mb-3">
                <Type size={15} className="text-brand-red" />
                <p className="text-sm font-bold text-gray-900">Add text</p>
            </div>

            <div className="flex gap-2 mb-4">
                <button
                    type="button"
                    onClick={addText}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white text-sm font-bold text-gray-700 px-4 py-2.5 hover:bg-gray-100 hover:border-gray-400 active:scale-[0.98] transition-all duration-150"
                >
                    <Type size={14} /> Add text
                </button>
                <button
                    type="button"
                    onClick={addEventInfo}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-black text-white text-sm font-bold px-4 py-2.5 hover:bg-gray-800 active:scale-[0.98] transition-all duration-150"
                >
                    <Sparkles size={14} /> Auto-fill event info
                </button>
            </div>

            {overlays.length === 0 ? (
                <p className="text-xs text-gray-400">No text added yet. Drag text on the video to reposition it.</p>
            ) : (
                <div className="space-y-2">
                    {overlays.map((o) => (
                        <div key={o.id} className="flex items-center gap-2 border border-gray-200 px-3 py-2 rounded-lg">
                            <input
                                value={o.content}
                                onChange={(e) => updateContent(o.id, e.target.value)}
                                className="flex-1 text-sm border-none focus:outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => removeOverlay(o.id)}
                                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TextControls;