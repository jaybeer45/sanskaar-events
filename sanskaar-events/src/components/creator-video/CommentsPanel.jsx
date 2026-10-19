// src/components/creator-video/CommentsPanel.jsx
import { useState, useEffect, useRef } from 'react';
import { X, Send, ChevronDown, ChevronUp, CornerDownRight } from 'lucide-react';
import { creatorVideoService } from '../../services/creatorVideo.service';

// One comment or reply row. Replies get extra left padding so they look nested.
const CommentRow = ({ comment, onReplyClick, isReply = false }) => (
    <div className={`flex gap-3 py-2.5 ${isReply ? 'pl-10' : ''}`}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-night text-xs font-bold text-marigold">
            {comment.user?.avatar ? (
                <img src={comment.user.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
                comment.user?.name?.[0]?.toUpperCase() || '?'
            )}
        </div>
        <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-night">{comment.user?.name || 'Someone'}</p>
            <p className="break-words text-sm text-ink/80">{comment.text}</p>
            {!isReply && (
                <button
                    type="button"
                    onClick={() => onReplyClick(comment)}
                    className="-ml-1 mt-0.5 px-1 py-1 text-xs font-semibold text-ink/50 transition-colors hover:text-night"
                >
                    Reply
                </button>
            )}
        </div>
    </div>
);

// Slide-up sheet listing a video's comments and replies, with an input to post either
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

    // Animate down, THEN actually close (200ms matches the transition below)
    const handleClose = () => {
        setMounted(false);
        setTimeout(onClose, 200);
    };

    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === 'Escape') handleClose();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onClose]);

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
          // bump the parent's visible repliesCount and append into its open list
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
          setError(err.response?.status === 401 ? 'Log in to comment.' : 'Could not post your comment.');
      } finally {
          setPosting(false);
      }
  };

    return (
      <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60" onClick={handleClose}>
          <div
              role="dialog"
              aria-modal="true"
              aria-label="Comments"
              className={`flex max-h-[70vh] w-full max-w-md flex-col rounded-t-3xl bg-white transition-transform duration-200 ease-out ${mounted ? 'translate-y-0' : 'translate-y-full'
                  }`}
              onClick={(e) => e.stopPropagation()}
          >
              <div className="flex items-center justify-between border-b border-mist px-5 py-3">
                  <h3 className="font-heading text-base font-bold text-night">Comments ({video.commentsCount || 0})</h3>
                  <button
                      type="button"
                      onClick={handleClose}
                      aria-label="Close comments"
                      className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-night/5"
                  >
                      <X size={18} className="text-night/60" />
                  </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-2">
                  {loading ? (
                      <p className="py-6 text-center text-sm text-ink/60">Loading comments...</p>
                  ) : comments.length === 0 ? (
                          <p className="py-6 text-center text-sm text-ink/60">No comments yet. Be the first!</p>
                      ) : (
                          comments.map((c) => (
                              <div key={c._id}>
                                  <CommentRow comment={c} onReplyClick={handleReplyClick} />

                    {c.repliesCount > 0 && (
                        <button
                            type="button"
                            onClick={() => toggleReplies(c)}
                            className="mb-1 ml-12 flex items-center gap-1 py-1 text-xs font-semibold text-ink/60 transition-colors hover:text-night"
                        >
                            {openReplies[c._id] ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
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
                  <div className="flex items-center justify-between border-t border-mist bg-moonlight px-5 py-2">
                      <span className="flex items-center gap-1.5 text-xs text-ink/70">
                          <CornerDownRight size={12} /> Replying to {replyingTo.user?.name || 'comment'}
                      </span>
                      <button
                          type="button"
                          onClick={() => setReplyingTo(null)}
                          className="px-2 py-1 text-xs font-semibold text-ink/60 transition-colors hover:text-night"
                      >
                          Cancel
                      </button>
                  </div>
              )}

              <form
                  onSubmit={handleSubmit}
                  className="flex items-center gap-2 border-t border-mist px-4 pt-3"
                  style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
              >
                  <input
                      ref={inputRef}
                      type="text"
                      aria-label={replyingTo ? 'Write a reply' : 'Add a comment'}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder={replyingTo ? 'Write a reply...' : 'Add a comment...'}
                      maxLength={300}
                      className="h-11 flex-1 rounded-pill bg-moonlight px-4 text-sm text-ink outline-none transition-colors focus:bg-white focus:ring-2 focus:ring-night/20"
                  />
                  <button
                      type="submit"
                      aria-label="Post"
                      disabled={!text.trim() || posting}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-red transition-colors hover:bg-brand-red-hover disabled:opacity-40"
                  >
                      <Send size={16} className="text-white" />
                  </button>
              </form>
              {error && <p role="alert" className="px-5 pb-3 text-xs text-red-600">{error}</p>}
          </div>
      </div>
  );
};

export default CommentsPanel;