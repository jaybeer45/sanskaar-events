
// src/components/creator-video/CreateVideoModal.jsx

import { useRef } from 'react';
import { Upload, Camera, X, Video } from 'lucide-react';

const CreateVideoModal = ({ isOpen, onClose, onUpload, onCamera }) => {
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];

        // Allow selecting the same file again later
        e.target.value = '';

        if (!file) return;

        // Video validation
        if (!file.type.startsWith('video/')) {
            alert('Please select a video file.');
            return;
        }

        // 30 MB limit for now
        const maxSize = 30 * 1024 * 1024;

        if (file.size > maxSize) {
            alert('Video size must be less than 30 MB.');
            return;
        }

        onUpload(file);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
                                <Video size={18} className="text-brand-red" />
                            </div>

                            <h2 className="font-black text-lg text-gray-900">
                                Create Event Video
                            </h2>
                        </div>

                        <p className="text-xs text-gray-500 mt-2 ml-11">
                            Create a short video to promote this event
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-all"
                        aria-label="Close"
                    >
                        <X size={18} className="text-gray-500" />
                    </button>
                </div>

                {/* Options */}
                <div className="p-6 space-y-3">

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    {/* Upload */}
                    <button
                        type="button"
                        onClick={handleUploadClick}
                        className="
                            w-full flex items-center gap-4
                            border border-gray-200
                            rounded-xl p-4
                            text-left cursor-pointer
                            hover:border-brand-red
                            hover:bg-red-50/50
                            active:scale-[0.99]
                            transition-all duration-150
                            group
                        "
                    >
                        <div className="w-11 h-11 rounded-full bg-gray-100 group-hover:bg-red-100 flex items-center justify-center transition-colors">
                            <Upload
                                size={20}
                                className="text-gray-600 group-hover:text-brand-red"
                            />
                        </div>

                        <div>
                            <p className="font-bold text-sm text-gray-900">
                                Upload from device
                            </p>

                            <p className="text-xs text-gray-500 mt-0.5">
                                Choose a video from your phone or computer
                            </p>
                        </div>
                    </button>

                    {/* Camera */}
                    <button
                        type="button"
                        onClick={onCamera}
                        className="
                            w-full flex items-center gap-4
                            border border-gray-200
                            rounded-xl p-4
                            text-left cursor-pointer
                            hover:border-brand-red
                            hover:bg-red-50/50
                            active:scale-[0.99]
                            transition-all duration-150
                            group
                        "
                    >
                        <div className="w-11 h-11 rounded-full bg-gray-100 group-hover:bg-red-100 flex items-center justify-center transition-colors">
                            <Camera
                                size={20}
                                className="text-gray-600 group-hover:text-brand-red"
                            />
                        </div>

                        <div>
                            <p className="font-bold text-sm text-gray-900">
                                Record with camera
                            </p>

                            <p className="text-xs text-gray-500 mt-0.5">
                                Record a new video using your camera
                            </p>
                        </div>
                    </button>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="
                            w-full py-3
                            rounded-lg
                            border border-gray-300
                            bg-white
                            text-sm font-bold text-gray-700
                            cursor-pointer
                            hover:bg-gray-100
                            hover:border-gray-400
                            active:scale-[0.98]
                            active:bg-gray-200
                            transition-all duration-150
                        "
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateVideoModal;

