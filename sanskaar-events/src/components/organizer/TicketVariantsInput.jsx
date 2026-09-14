// src/components/organizer/TicketVariantsInput.jsx
import { X } from 'lucide-react';

const TicketVariantsInput = ({ variants, onChange }) => {
    const addRow = () => {
        onChange([...variants, { name: '', price: '', capacity: '' }]);
    };

    const updateRow = (index, field, value) => {
        const copy = [...variants];
        copy[index] = { ...copy[index], [field]: value };
        onChange(copy);
    };

    const removeRow = (index) => {
        onChange(variants.filter((_, i) => i !== index));
    };

    return (
        <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
                <h2 className="font-black text-base text-gray-900">Ticket Types (optional)</h2>
                <button
                    type="button"
                    onClick={addRow}
                    className="text-xs font-bold text-brand-red border border-brand-red px-3 py-1.5"
                >
                    + Add ticket type
                </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">
                Leave empty to use the single price above. Add rows here for multiple ticket tiers (e.g. Silver, Gold, VIP).
            </p>

            {variants.map((v, i) => (
                <div key={i} className="grid grid-cols-[2fr_1fr_1fr_auto] gap-3 mb-3 items-end">
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Name</label>
                        <input
                            value={v.name}
                            onChange={(e) => updateRow(i, 'name', e.target.value)}
                            placeholder="e.g. Silver"
                            className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Price (₹)</label>
                        <input
                            type="number"
                            value={v.price}
                            onChange={(e) => updateRow(i, 'price', e.target.value)}
                            placeholder="500"
                            className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Capacity</label>
                        <input
                            type="number"
                            value={v.capacity}
                            onChange={(e) => updateRow(i, 'capacity', e.target.value)}
                            placeholder="100"
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

export default TicketVariantsInput;