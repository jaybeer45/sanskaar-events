// src/components/creator-video/CreatorEditor.jsx
import { useState, useRef, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import TrimControls from './TrimControls';
import FilterControls from './FilterControls';
import TextControls from './TextControls';
import TextOverlayLayer from './TextOverlayLayer';
import PreviewStep from './PreviewStep';

const STEPS = ['trim', 'filter', 'text', 'preview'];
const STEP_LABELS = { trim: 'Trim', filter: 'Filter', text: 'Text', preview: 'Preview' };

// Full-screen editor shell. Owns the source video file and shared editing
// state (trim range, filter, text overlays) — step components below just
// render controls and call back up to update this state.
const CreatorEditor = ({ file, event, initialFilter, onClose, onExport, isExporting }) => {

    const [stepIndex, setStepIndex] = useState(0);
    const [videoUrl, setVideoUrl] = useState('');
    const videoRef = useRef(null);
    const previewContainerRef = useRef(null);


    // Editing state — shared across steps, applied together at export time
    const [trimRange, setTrimRange] = useState({ start: 0, end: 0 });
    const [videoDuration, setVideoDuration] = useState(0);
    const [textOverlays, setTextOverlays] = useState([]);
    const [selectedFilter, setSelectedFilter] = useState(initialFilter || 'none');
    const [visibility, setVisibility] = useState('private');

    useEffect(() => {
        const url = URL.createObjectURL(file);
        setVideoUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const handleLoadedMetadata = () => {
        const duration = videoRef.current?.duration || 0;
        setVideoDuration(duration);
        setTrimRange({ start: 0, end: Math.min(duration, 30) }); // default: full clip or 30s max
    };

    const currentStep = STEPS[stepIndex];
    const goNext = () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-200">
                <button
                    type="button"
                    onClick={onClose}
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 active:scale-[0.96] transition-all duration-150"
                    aria-label="Close"
                >
                    <X size={18} className="text-gray-500" />
                </button>

                <div className="flex items-center gap-1.5">
                    {STEPS.map((s, i) => (
                        <span
                            key={s}
                            className={`text-xs font-bold px-3.5 py-1.5 rounded-full transition-all duration-150 ${i === stepIndex
                                ? 'bg-brand-red text-white shadow-sm'
                                : i < stepIndex
                                    ? 'bg-red-50 text-brand-red'
                                    : 'bg-gray-100 text-gray-400'
                                }`}
                        >
                            {STEP_LABELS[s]}
                        </span>
                    ))}
                </div>

                <div className="w-9" /> {/* spacer to balance the close button */}
            </div>


            {/* Video preview — fixed 9:16 box with object-cover, matching final
    Community Creations playback exactly, so text overlay positions
    line up with what will actually be shown after publishing. */}
            <div className="flex-1 flex items-center justify-center bg-black overflow-hidden relative p-2">
                <div ref={previewContainerRef} className="relative aspect-[9/16] max-h-full w-auto overflow-hidden rounded-lg">
                    <video
                        ref={videoRef}
                        src={videoUrl}
                        onLoadedMetadata={handleLoadedMetadata}
                        controls
                        className="w-full h-full object-cover"
                        style={{ filter: selectedFilter === 'none' ? 'none' : selectedFilter }}
                    />

                    <TextOverlayLayer overlays={textOverlays} onChange={setTextOverlays} containerRef={previewContainerRef} />
                </div>
            </div>

            {/* Step controls */}
            <div className="bg-white rounded-t-2xl shadow-2xl p-5 min-h-[160px] border-t border-gray-200">
                {currentStep === 'trim' && (
                    <TrimControls
                        duration={videoDuration}
                        trimRange={trimRange}
                        onChange={setTrimRange}
                        videoRef={videoRef}

                    />
                )}
                {currentStep === 'filter' && (
                    <FilterControls selectedFilter={selectedFilter} onChange={setSelectedFilter} />
                )}
                {currentStep === 'text' && (
                    <TextControls overlays={textOverlays} onChange={setTextOverlays} event={event} />
                )}
                {currentStep === 'preview' && (
                    <PreviewStep
                        trimRange={trimRange}
                        selectedFilter={selectedFilter}
                        textOverlays={textOverlays}
                        visibility={visibility}
                        onVisibilityChange={setVisibility}
                    />
                )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between px-5 py-4 bg-white border-t border-gray-200">
                <button
                    type="button"
                    onClick={goBack}
                    disabled={stepIndex === 0}
                    className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white text-sm font-bold text-gray-700 px-4 py-2.5 cursor-pointer hover:bg-gray-100 hover:border-gray-400 active:scale-[0.98] active:bg-gray-200 disabled:opacity-30 disabled:pointer-events-none transition-all duration-150"
                >
                    <ChevronLeft size={16} /> Back
                </button>

                {currentStep === 'preview' ? (
                    <button
                        type="button"
                        onClick={() => onExport({ file, trimRange, selectedFilter, textOverlays, visibility })}
                        disabled={isExporting}
                        className="inline-flex items-center gap-2 rounded-lg bg-black text-white font-bold text-sm px-6 py-2.5 hover:bg-gray-800 active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-60"
                    >
                        <Check size={16} /> {isExporting ? 'Uploading...' : 'Save & Upload'}
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={goNext}
                        className="inline-flex items-center gap-1 rounded-lg bg-black text-white font-bold text-sm px-6 py-2.5 hover:bg-gray-800 active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                        Next <ChevronRight size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default CreatorEditor;