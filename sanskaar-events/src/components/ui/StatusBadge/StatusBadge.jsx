// src/components/ui/StatusBadge/StatusBadge.jsx
const TONES = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-amber-100 text-amber-800',
    info: 'bg-blue-100 text-blue-800',
    danger: 'bg-red-100 text-red-800',
    neutral: 'bg-gray-200 text-gray-700',
};

const StatusBadge = ({ tone = 'neutral', children }) => (
    <span
        className={`inline-flex shrink-0 items-center rounded-pill px-2.5 py-1 text-xs font-semibold capitalize ${TONES[tone]}`}
    >
        {children}
    </span>
);

export default StatusBadge;