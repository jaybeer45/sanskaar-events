// src/components/organizer/ArtistsInput.jsx
import { useState } from 'react';
import { X, Upload, User } from 'lucide-react';
import { uploadService } from '../../services/upload.service';

// Each artist row: name, short bio, and an optional photo. Photo upload
// happens immediately on file select (not deferred to form submit) so the
// row shows a live preview and the parent's `artists` array always holds
// a final URL, not a File object.
const ArtistsInput = ({ artists, onChange }) => {
    const [uploadingIndex, setUploadingIndex] = useState(null);

    const addRow = () => {
        onChange([...artists, { name: '', bio: '', photo: '', socialLink: '' }]);
    };

    const updateRow = (index, field, value) => {
        const copy = [...artists];
        copy[index] = { ...copy[index], [field]: value };
        onChange(copy);
    };

    const removeRow = (index) => {
        onChange(artists.filter((_, i) => i !== index));
    };

    const handlePhotoSelect = async (index, e) => {
        const file = e.target.files[0];
        e.target.value = '';
        if (!file) return;

        setUploadingIndex(index);
        try {
            const res = await uploadService.uploadEventImages([file]);
            updateRow(index, 'photo', res.data.urls[0]);
        } catch (err) {
            console.error('Artist photo upload failed:', err.response?.data || err.message);
        } finally {
            setUploadingIndex(null);
        }
    };

    return (
        <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
                <h2 className="font-black text-base text-gray-900">Artists (optional)</h2>
                <button
                    type="button"
                    onClick={addRow}
                    className="text-xs font-bold text-brand-red border border-brand-red px-3 py-1.5"
                >
                    + Add artist
                </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">
                Add performers or artists featured at this event — they'll show up on the event page.
            </p>

            {artists.map((a, i) => (
                <div key={i} className="flex gap-3 mb-4 items-start border border-gray-100 p-3">
                    {/* Photo */}
                    <div className="shrink-0">
                        <label
                            htmlFor={`artist-photo-${i}`}
                            className="w-16 h-16 border border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-brand-red overflow-hidden relative"
                        >
                            {a.photo ? (
                                <img src={a.photo} alt="" className="w-full h-full object-cover" />
                            ) : uploadingIndex === i ? (
                                <span className="text-[10px] text-gray-400">...</span>
                            ) : (
                                <User size={20} className="text-gray-300" />
                            )}
                            <input
                                id={`artist-photo-${i}`}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(e) => handlePhotoSelect(i, e)}
                                className="hidden"
                            />
                        </label>
                    </div>

                    {/* Name + bio */}
                    <div className="flex-1 space-y-2">
                        <input
                            value={a.name}
                            onChange={(e) => updateRow(i, 'name', e.target.value)}
                            placeholder="Artist name"
                            className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-brand-red transition-colors"
                        />
                        <input
                            value={a.bio}
                            onChange={(e) => updateRow(i, 'bio', e.target.value)}
                            placeholder="Short bio (optional)"
                            className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-brand-red transition-colors"
                        />
                        <input
                            value={a.socialLink}
                            onChange={(e) => updateRow(i, 'socialLink', e.target.value)}
                            placeholder="Instagram / YouTube link (optional)"
                            className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-brand-red transition-colors"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => removeRow(i)}
                        className="h-9 px-2.5 border border-gray-300 text-gray-500 hover:border-red-400 hover:text-red-500 transition-colors shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default ArtistsInput;