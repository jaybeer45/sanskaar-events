// src/pages/Home/components/CategoryPills.jsx
// EXACT reference match:
// Horizontally scrollable tab row, no emojis, no rounded pills
// Active: red bottom border · Inactive: plain gray text
import { EVENT_CATEGORIES } from '../../../constants/categories';

const CategoryPills = ({ active = 'all', onChange }) => (
  <div className="flex items-center gap-0 overflow-x-auto scrollbar-none">
    {EVENT_CATEGORIES.map((cat) => (
      <button
        key={cat.id}
        onClick={() => onChange(cat.id)}
        className={`whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px shrink-0
          ${active === cat.id
            ? 'border-brand-red text-brand-red'
            : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
      >
        {cat.label}
      </button>
    ))}
  </div>
);

export default CategoryPills;
