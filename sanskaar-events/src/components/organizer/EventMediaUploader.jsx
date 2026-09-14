// src/components/organizer/EventMediaUploader.jsx
import { useState } from 'react';
import { Upload, X, Film } from 'lucide-react';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_VIDEO_EXT = ['.mp4', '.webm', '.mov'];
const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

// One combined "Event Media" card — images and the promotional video live
// together here since the event page displays them as one carousel. Parent
// owns all four pieces of state and gets updates via the on* callbacks.
const EventMediaUploader = ({
    existingImages,
    onExistingImagesChange,
    selectedFiles,
    onFilesChange,
    existingVideoUrl,
    onExistingVideoChange,
    selectedVideoFile,
    onVideoFileChange,
}) => {
    const [imageError, setImageError] = useState('');
    const [videoError, setVideoError] = useState('');

    // ── Images ──────────────────────────────────────────────
    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        setImageError('');

        const totalCount = existingImages.length + selectedFiles.length;
        const remainingSlots = MAX_IMAGES - totalCount;

        if (remainingSlots <= 0) {
            setImageError(`You can upload a maximum of ${MAX_IMAGES} images.`);
            e.target.value = '';
            return;
        }

        const selected = files.slice(0, remainingSlots);
        const validFiles = [];

        for (const file of selected) {
            if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
                setImageError(`${file.name} is not a valid image. Only JPG, PNG and WebP are allowed.`);
                continue;
            }
            if (file.size > MAX_IMAGE_SIZE) {
                setImageError(`${file.name} is larger than 5MB. Please select a smaller image.`);
                continue;
            }
            validFiles.push(file);
        }

        onFilesChange([...selectedFiles, ...validFiles].slice(0, MAX_IMAGES));
        e.target.value = '';
    };

    const removeFile = (index) => {
        onFilesChange(selectedFiles.filter((_, i) => i !== index));
    };

    const removeExistingImage = (url) => {
        onExistingImagesChange(existingImages.filter((u) => u !== url));
    };

    const totalImageCount = existingImages.length + selectedFiles.length;

    // ── Video ───────────────────────────────────────────────
    const handleVideoSelect = (e) => {
        const file = e.target.files[0];
        setVideoError('');
        if (!file) return;

        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!ALLOWED_VIDEO_TYPES.includes(file.type) && !ALLOWED_VIDEO_EXT.includes(ext)) {
            setVideoError('Only MP4, WebM, or MOV videos are allowed.');
            e.target.value = '';
            return;
        }
        if (file.size > MAX_VIDEO_SIZE) {
            setVideoError('Video must be under 50MB.');
            e.target.value = '';
            return;
        }

        onVideoFileChange(file);
        e.target.value = '';
    };

    const removeVideo = () => {
        onVideoFileChange(null);
        onExistingVideoChange('');
    };

    return (
        <div className="bg-white border border-gray-200 p-6 space-y-6">
            <h2 className="font-black text-base text-gray-900">Event Media</h2>

            {/* ── Images ── */}
            <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Images</p>

                {imageError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-3">
                        {imageError}
                    </div>
                )}

                {existingImages.length > 0 && (
                    <div className="grid grid-cols-5 gap-2 mb-3">
                        {existingImages.map((url) => (
                            <div key={url} className="relative aspect-square">
                                <img src={url} alt="" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeExistingImage(url)}
                                    className="absolute -top-1.5 -right-1.5 bg-black text-white rounded-full w-5 h-5 flex items-center justify-center"
                                >
                                    <X size={11} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <label
                    htmlFor="event-image-input"
                    className="border-2 border-dashed border-gray-300 flex flex-col items-center justify-center py-10 cursor-pointer hover:border-brand-red transition-colors"
                    style={{
                        backgroundImage: 'repeating-linear-gradient(135deg, #f9fafb 0px, #f9fafb 2px, #f3f4f6 2px, #f3f4f6 12px)',
                    }}
                >
                    <Upload size={24} className="text-gray-400 mb-2" />
                    <p className="text-sm font-semibold text-gray-600">Click to upload images</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP up to 5MB each · {MAX_IMAGES} max</p>
                    <input
                        id="event-image-input"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleImageSelect}
                        disabled={totalImageCount >= MAX_IMAGES}
                        className="hidden"
                    />
                </label>

                {selectedFiles.length > 0 && (
                    <div className="grid grid-cols-5 gap-2 mt-3">
                        {selectedFiles.map((file, i) => (
                            <div key={i} className="relative aspect-square">
                                <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeFile(i)}
                                    className="absolute -top-1.5 -right-1.5 bg-black text-white rounded-full w-5 h-5 flex items-center justify-center"
                                >
                                    <X size={11} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Video ── */}
            <div className="pt-6 border-t border-gray-100">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Promotional video (optional)</p>

                {videoError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-3">
                        {videoError}
                    </div>
                )}

                {(existingVideoUrl || selectedVideoFile) ? (
                    <div className="flex items-center justify-between border border-gray-200 px-4 py-3">
                        <span className="flex items-center gap-2 text-sm text-gray-700 truncate">
                            <Film size={14} className="text-gray-400 shrink-0" />
                            {selectedVideoFile ? selectedVideoFile.name : 'Current video'}
                        </span>
                        <button
                            type="button"
                            onClick={removeVideo}
                            className="text-xs font-bold text-red-500 border border-red-200 px-2 py-1 hover:border-red-400 shrink-0"
                        >
                            Remove
                        </button>
                    </div>
                ) : (
                    <label
                        htmlFor="event-video-input"
                        className="border-2 border-dashed border-gray-300 flex flex-col items-center justify-center py-10 cursor-pointer hover:border-brand-red transition-colors"
                    >
                        <Film size={24} className="text-gray-400 mb-2" />
                        <p className="text-sm font-semibold text-gray-600">Click to upload a video</p>
                        <p className="text-xs text-gray-400 mt-1">MP4, WebM, or MOV up to 50MB</p>
                        <input
                            id="event-video-input"
                            type="file"
                            accept="video/mp4,video/webm,video/quicktime"
                            onChange={handleVideoSelect}
                            className="hidden"
                        />
                    </label>
                )}
            </div>
        </div>
    );
};

export default EventMediaUploader;