import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { bookingMessageService } from '../../services/bookingMessage.service';
import Spinner from '../ui/Spinner/Spinner';

// Self-contained: only fetches once the panel is opened, and polls every 5s
// while open so both sides see new messages without a manual refresh. No
// websockets for bookings yet, so polling is the simple, honest choice:
// swap the interval for a socket subscription later if it's ever needed.
const POLL_MS = 5000;

const BookingChatThread = ({ bookingId }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [yourRole, setYourRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  const fetchMessages = (isFirstLoad) => {
    if (isFirstLoad) setLoading(true);
    bookingMessageService
      .getMessages(bookingId)
      .then((res) => {
        setMessages(res.data.results || []);
        setYourRole(res.data.yourRole);
      })
      .catch(() => {
        // Silent on background polls so a network hiccup doesn't toast every 5s.
        // A failed first load is still worth telling the user about, since the
        // whole panel would otherwise be blank.
        if (isFirstLoad) toast.error('Failed to load messages.');
      })
      .finally(() => { if (isFirstLoad) setLoading(false); });
  };

  useEffect(() => {
    if (!open) return;
    fetchMessages(true);
    pollRef.current = setInterval(() => fetchMessages(false), POLL_MS);
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, bookingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await bookingMessageService.sendMessage(bookingId, { text: text.trim() });
      setText('');
      fetchMessages(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message.');
    }
    setSending(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-1.5 rounded-pill border border-night/30 px-4 text-sm font-semibold text-night transition-colors hover:bg-night/5"
      >
        <MessageCircle size={15} /> Message
      </button>
    );
  }

  return (
    <div className="border-t border-mist pt-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-heading text-sm font-bold text-night">Messages</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close messages"
          className="-mr-2 flex h-9 w-9 items-center justify-center rounded-full text-night/50 transition-colors hover:bg-night/5 hover:text-night"
        >
          <X size={16} />
        </button>
      </div>

      <div
        role="log"
        aria-live="polite"
        className="h-64 space-y-2 overflow-y-auto rounded-2xl border border-mist bg-moonlight p-3"
      >
        {loading ? (
          <div className="flex h-full items-center justify-center"><Spinner size="sm" /></div>
        ) : messages.length === 0 ? (
            <p className="mt-4 text-center text-sm text-ink/60">No messages yet. Say hello.</p>
        ) : (
          messages.map((m) => {
            const isMine = m.senderRole === yourRole;
            return (
              <div key={m._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${isMine
                      ? 'rounded-br-md bg-night text-white'
                      : 'rounded-bl-md border border-mist bg-white text-ink'
                  }`}
                >
                  <p className="break-words">{m.text}</p>
                  <p className={`mt-0.5 text-[11px] ${isMine ? 'text-white/60' : 'text-ink/50'}`}>
                    {new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="mt-2 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Type a message"
          placeholder="Type a message"
          className="h-11 flex-1 rounded-pill border border-transparent bg-moonlight px-4 text-sm text-ink transition-colors focus:border-night focus:bg-white focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Send message"
          disabled={sending || !text.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-red text-white transition-colors hover:bg-brand-red-hover disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default BookingChatThread;