// src/components/creator-video/CommentsPanel.jsx
import { useState, useEffect, useRef } from 'react';
import { X, Send, ChevronDown, ChevronUp, CornerDownRight } from 'lucide-react';
import { creatorVideoService } from '../../services/creatorVideo.service';

// One comment or reply row. Replies get extra left-padding so they look nested.
const CommentRow = ({ comment, onReplyClick, isReply = false }) => (
    <div className={`flex gap-2.5 py-2.5 ${isReply ? 'pl-8' : ''}`}>
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-600 overflow-hidden">
            {comment.user?.avatar ? (
                <img src={comment.user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
                comment.user?.name?.[0]?.toUpperCase() || '?'
            )}
        </div>
        <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-gray-900">{comment.user?.name || 'Someone'}</p>
            <p className="text-sm text-gray-700 break-words">{comment.text}</p>
            {!isReply && (
                <button
                    type="button"
                    onClick={() => onReplyClick(comment)}
                    className="text-[11px] font-bold text-gray-400 mt-1"
                >
                    Reply
                </button>
            )}
        </div>
    </div>
);

// Slide-up sheet listing a video's comments + replies, with an input to post either.
const CommentsPanel = ({ video, onClose, onCommentsCountChange }) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState('');
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false); // drives the slide-up/down animation

    const [replyingTo, setReplyingTo] = useState(null); // comment object, or null
    const [openReplies, setOpenReplies] = useState({}); // { [commentId]: replies[] }
    const [loadingReplies, setLoadingReplies] = useState({}); // { [commentId]: true }

    const inputRef = useRef(null);

    useEffect(() => {
        creatorVideoService
            .getComments(video._id)
            .then((res) => setComments(res.data.comments || []))
            .finally(() => setLoading(false));
        // slide up on the next frame, after the panel is already in the DOM
        requestAnimationFrame(() => setMounted(true));
    }, [video._id]);

    // animate down, THEN actually close (200ms matches the transition below)
    const handleClose = () => {
        setMounted(false);
        setTimeout(onClose, 200);
    };

    const toggleReplies = async (comment) => {
        if (openReplies[comment._id]) {
            setOpenReplies((prev) => {
                const next = { ...prev };
                delete next[comment._id];
                return next;
            });
            return;
        }
        setLoadingReplies((prev) => ({ ...prev, [comment._id]: true }));
        try {
            const res = await creatorVideoService.getReplies(comment._id);
            setOpenReplies((prev) => ({ ...prev, [comment._id]: res.data.replies || [] }));
        } finally {
            setLoadingReplies((prev) => ({ ...prev, [comment._id]: false }));
        }
    };

    const handleReplyClick = (comment) => {
        setReplyingTo(comment);
        inputRef.current?.focus();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim() || posting) return;

        setPosting(true);
        setError('');
        try {
            const res = await creatorVideoService.addComment(video._id, text.trim(), replyingTo?._id || null);

            if (replyingTo) {
                // bump the parent's visible repliesCount + append into its open list
                setComments((prev) =>
                    prev.map((c) =>
                        c._id === replyingTo._id ? { ...c, repliesCount: (c.repliesCount || 0) + 1 } : c
                    )
                );
                setOpenReplies((prev) => ({
                    ...prev,
                    [replyingTo._id]: [...(prev[replyingTo._id] || []), res.data.comment],
                }));
            } else {
                setComments((prev) => [res.data.comment, ...prev]);
            }

            onCommentsCountChange?.(res.data.commentsCount);
            setText('');
            setReplyingTo(null);
        } catch (err) {
            setError(err.response?.status === 401 ? 'Login to comment.' : 'Could not post comment.');
        } finally {
            setPosting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-end justify-center" onClick={handleClose}>
            <div
                className={`w-full max-w-sm bg-white rounded-t-2xl max-h-[70vh] flex flex-col transition-transform duration-200 ease-out ${mounted ? 'translate-y-0' : 'translate-y-full'
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <h3 className="font-bold text-sm text-gray-900">Comments ({video.commentsCount || 0})</h3>
                    <button type="button" onClick={handleClose}>
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
                            <div key={c._id}>
                                <CommentRow comment={c} onReplyClick={handleReplyClick} />

                                {c.repliesCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => toggleReplies(c)}
                                        className="ml-11 flex items-center gap-1 text-[11px] font-bold text-gray-500 mb-1"
                                    >
                                        {openReplies[c._id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                        {loadingReplies[c._id]
                                            ? 'Loading...'
                                            : openReplies[c._id]
                                                ? 'Hide replies'
                                                : `View ${c.repliesCount} ${c.repliesCount === 1 ? 'reply' : 'replies'}`}
                                    </button>
                                )}

                                {openReplies[c._id]?.map((r) => (
                                    <CommentRow key={r._id} comment={r} isReply onReplyClick={() => { }} />
                                ))}
                            </div>
                        ))
                    )}
                </div>

                {replyingTo && (
                    <div className="flex items-center justify-between px-4 py-1.5 bg-gray-50 border-t border-gray-100">
                        <span className="text-[11px] text-gray-500 flex items-center gap-1">
                            <CornerDownRight size={11} /> Replying to {replyingTo.user?.name || 'comment'}
                        </span>
                        <button type="button" onClick={() => setReplyingTo(null)} className="text-[11px] text-gray-400 font-bold">
                            Cancel
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-3 border-t border-gray-100">
                    <input
                        ref={inputRef}
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={replyingTo ? 'Write a reply...' : 'Add a comment...'}
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