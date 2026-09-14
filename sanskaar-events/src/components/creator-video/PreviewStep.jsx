// src/components/creator-video/PreviewStep.jsx
import { Eye, Scissors, SlidersHorizontal, Type } from 'lucide-react';
import { FILTER_PRESETS } from './FilterControls';

const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

// Read-only summary of everything applied so far. The actual video preview
// (with filter + text) is already visible above this panel in CreatorEditor
// — this is just a quick checklist before the user hits "Save & Upload".
const PreviewStep = ({ trimRange, selectedFilter, textOverlays, visibility, onVisibilityChange }) => {
    const filterLabel = FILTER_PRESETS.find((f) => f.css === selectedFilter)?.label || 'Normal';
    const clipLength = trimRange.end - trimRange.start;

    return (
        <div>
            <div className="flex items-center gap-2 mb-4">
                <Eye size={15} className="text-brand-red" />
                <p className="text-sm font-bold text-gray-900">Ready to share</p>
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                    <Scissors size={14} className="text-gray-400 shrink-0" />
                    <span className="text-gray-500">Clip length:</span>
                    <span className="font-bold text-gray-900">{formatTime(clipLength)}</span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                    <SlidersHorizontal size={14} className="text-gray-400 shrink-0" />
                    <span className="text-gray-500">Filter:</span>
                    <span className="font-bold text-gray-900">{filterLabel}</span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                    <Type size={14} className="text-gray-400 shrink-0" />
                    <span className="text-gray-500">Text overlays:</span>
                    <span className="font-bold text-gray-900">
                        {textOverlays.length === 0 ? 'None' : `${textOverlays.length} added`}
                    </span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-4">
                    <div>
                        <p className="text-sm font-bold text-gray-900">Make public</p>
                        <p className="text-xs text-gray-400">Visible to others in this event's Community Creations</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => onVisibilityChange(visibility === 'public' ? 'private' : 'public')}
                        className={`w-11 h-6 rounded-full transition-colors relative ${visibility === 'public' ? 'bg-brand-red' : 'bg-gray-300'}`}
                    >
                        <span
                            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${visibility === 'public' ? 'translate-x-5' : 'translate-x-0.5'
                                }`}
                        />
                    </button>
                </div>
            </div>

            <p className="text-xs text-gray-400 mt-4">
                Tap "Save & Upload" to publish this video to the event page.
            </p>
        </div>
    );
};

export default PreviewStep;