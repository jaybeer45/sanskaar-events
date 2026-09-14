// src/components/organizer/EventDatesInput.jsx
import { X } from 'lucide-react';

// Controlled component — parent owns the `dates` array and receives updates
// via onChange. Keeps OrganizerPage.jsx from carrying this row-management
// logic inline.
const EventDatesInput = ({ dates, onChange }) => {
    const addRow = () => {
        onChange([...dates, { date: '', label: '', capacity: '' }]);
    };

    const updateRow = (index, field, value) => {
        const copy = [...dates];
        copy[index] = { ...copy[index], [field]: value };
        onChange(copy);
    };

    const removeRow = (index) => {
        onChange(dates.filter((_, i) => i !== index));
    };

    return (
        <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Additional dates (optional)
                </label>
                <button
                    type="button"
                    onClick={addRow}
                    className="text-xs font-bold text-brand-red border border-brand-red px-3 py-1.5"
                >
                    + Add date
                </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">
                Leave empty for a single-date event. Add rows if this event runs across multiple dates —
                attendees will be able to pick a date, and you'll be able to reschedule bookings between them.
            </p>

            {dates.map((d, i) => (
                <div key={i} className="grid grid-cols-[1.2fr_1fr_1fr_auto] gap-3 mb-3 items-end">
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Date</label>
                        <input
                            type="date"
                            value={d.date}
                            onChange={(e) => updateRow(i, 'date', e.target.value)}
                            className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Label</label>
                        <input
                            value={d.label}
                            onChange={(e) => updateRow(i, 'label', e.target.value)}
                            placeholder="e.g. Day 1"
                            className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Capacity</label>
                        <input
                            type="number"
                            value={d.capacity}
                            onChange={(e) => updateRow(i, 'capacity', e.target.value)}
                            placeholder="0 = no per-day cap"
                            className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red transition-colors"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => removeRow(i)}
                        className="h-[42px] px-3 border border-gray-300 text-gray-500 hover:border-red-400 hover:text-red-500 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default EventDatesInput;