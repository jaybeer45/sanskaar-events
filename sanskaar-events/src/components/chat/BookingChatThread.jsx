import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { bookingMessageService } from '../../services/bookingMessage.service';
import Spinner from '../ui/Spinner/Spinner';

// Self-contained: only fetches once the panel is opened, and polls every 5s
// while open so both sides see new messages without a manual refresh. No
// websockets in this codebase yet, so polling is the simple, honest choice —
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
        // Silent on background polls — don't spam a toast every 5s if the
        // network hiccups. The first load failing is still worth telling
        // the user about, since the whole panel is otherwise blank.
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
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-bold text-gray-600 border border-gray-300 px-3 py-1.5 hover:border-gray-400"
      >
        <MessageCircle size={14} /> Message
      </button>
    );
  }

  return (
    <div className="border-t border-gray-100 pt-3 mt-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-gray-500 uppercase">Messages</p>
        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700">
          <X size={16} />
        </button>
      </div>

      <div className="bg-[#f9f9f8] border border-gray-200 h-56 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="flex justify-center items-center h-full"><Spinner size="sm" /></div>
        ) : messages.length === 0 ? (
          <p className="text-xs text-gray-400 text-center mt-4">No messages yet. Say hello 👋</p>
        ) : (
          messages.map((m) => {
            const isMine = m.senderRole === yourRole;
            return (
              <div key={m._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] px-3 py-1.5 text-sm ${
                    isMine ? 'bg-brand-red text-white' : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  <p>{m.text}</p>
                  <p className={`text-[10px] mt-0.5 ${isMine ? 'text-white/70' : 'text-gray-400'}`}>
                    {new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 mt-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-brand-red"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="bg-brand-red text-white px-3 py-2 disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default BookingChatThread;
