// src/components/creator-video/CommentsPanel.jsx
import { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { creatorVideoService } from '../../services/creatorVideo.service';

// Slide-up sheet listing a video's comments, with an input to post a new one.
const CommentsPanel = ({ video, onClose, onCommentsCountChange }) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState('');
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        creatorVideoService
            .getComments(video._id)
            .then((res) => setComments(res.data.comments || []))
            .finally(() => setLoading(false));
    }, [video._id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim() || posting) return;

        setPosting(true);
        setError('');
        try {
            const res = await creatorVideoService.addComment(video._id, text.trim());
            setComments((prev) => [res.data.comment, ...prev]);
            onCommentsCountChange?.(res.data.commentsCount);
            setText('');
        } catch (err) {
            setError(err.response?.status === 401 ? 'Login to comment.' : 'Could not post comment.');
        } finally {
            setPosting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[60] bg-black/60 flex items-end justify-center"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm bg-white rounded-t-2xl max-h-[70vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <h3 className="font-bold text-sm text-gray-900">Comments ({video.commentsCount || 0})</h3>
                    <button type="button" onClick={onClose}>
                        <X size={18} className="text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-2">
                    {loading ? (
                        <p className="text-xs text-gray-400 py-4 text-center">Loading comments...</p>
                    ) : comments.length === 0 ? (
                        <p className="text-xs text-gray-400 py-4 text-center">No comments yet. Be the first!</p>
                    ) : (
                        comments.map((c) => (
                            <div key={c._id} className="flex gap-2.5 py-2.5">
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-600 overflow-hidden">
                                    {c.user?.avatar ? (
                                        <img src={c.user.avatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        c.user?.name?.[0]?.toUpperCase() || '?'
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-gray-900">{c.user?.name || 'Someone'}</p>
                                    <p className="text-sm text-gray-700 break-words">{c.text}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-3 border-t border-gray-100">
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Add a comment..."
                        maxLength={300}
                        className="flex-1 text-sm bg-gray-100 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-brand-red/30"
                    />
                    <button
                        type="submit"
                        disabled={!text.trim() || posting}
                        className="w-9 h-9 rounded-full bg-brand-red flex items-center justify-center disabled:opacity-40 flex-shrink-0"
                    >
                        <Send size={15} className="text-white" />
                    </button>
                </form>
                {error && <p className="text-[11px] text-red-500 px-4 pb-2">{error}</p>}
            </div>
        </div>
    );
};

export default CommentsPanel;