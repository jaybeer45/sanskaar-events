
// src/components/creator-video/CreateVideoButton.jsx

import { Video } from 'lucide-react';

const CreateVideoButton = ({ onClick }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className="
                inline-flex items-center gap-2
                px-5 py-3
                bg-black text-white
                rounded-lg
                font-bold text-sm
                hover:bg-gray-800
                transition-all duration-200
                shadow-sm hover:shadow-md
            "
        >
            <Video size={18} />
            Create Video
        </button>
    );
};

export default CreateVideoButton;

