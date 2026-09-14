// src/components/creator-video/FilterControls.jsx
import { SlidersHorizontal } from 'lucide-react';

// Simple CSS-filter presets — applied directly as the video element's
// `filter` style (see CreatorEditor). No canvas processing needed for the
// live preview; only at final export time does this get "burned in".
export const FILTER_PRESETS = [
    { id: 'none', label: 'Normal', css: 'none' },
    { id: 'warm', label: 'Warm', css: 'sepia(0.3) saturate(1.4) brightness(1.05)' },
    { id: 'cool', label: 'Cool', css: 'hue-rotate(15deg) saturate(1.2) brightness(1.05)' },
    { id: 'vintage', label: 'Vintage', css: 'sepia(0.5) contrast(0.9) brightness(0.95)' },
    { id: 'bw', label: 'B&W', css: 'grayscale(1) contrast(1.1)' },
    { id: 'cinematic', label: 'Cinematic', css: 'contrast(1.2) saturate(0.85) brightness(0.95)' },
];

const FilterControls = ({ selectedFilter, onChange }) => {
    return (
        <div>
            <div className="flex items-center gap-2 mb-3">
                <SlidersHorizontal size={15} className="text-brand-red" />
                <p className="text-sm font-bold text-gray-900">Choose a filter</p>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-1">
                {FILTER_PRESETS.map((f) => (
                    <button
                        key={f.id}
                        type="button"
                        onClick={() => onChange(f.css)}
                        className="flex flex-col items-center gap-1.5 shrink-0"
                    >
                        <div
                            className={`w-14 h-14 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 border-2 transition-all duration-150 ${selectedFilter === f.css ? 'border-brand-red scale-105 shadow-md' : 'border-transparent'
                                }`}
                            style={{ filter: f.css }}
                        />
                        <span
                            className={`text-[11px] font-bold ${selectedFilter === f.css ? 'text-brand-red' : 'text-gray-500'
                                }`}
                        >
                            {f.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default FilterControls;