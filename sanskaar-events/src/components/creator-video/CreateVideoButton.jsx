// src/components/creator-video/CreateVideoButton.jsx
import { Video } from 'lucide-react';

const CreateVideoButton = ({ onClick }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex items-center gap-2 rounded-pill bg-night hover:bg-night-soft text-white font-heading font-semibold text-sm px-5 py-2.5 transition-colors"
        >
            <Video size={17} />
            Create video
        </button>
    );
};

export default CreateVideoButton;