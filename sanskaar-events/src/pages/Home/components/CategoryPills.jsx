// src/pages/Home/components/CategoryPills.jsx
import { EVENT_CATEGORIES } from '../../../constants/categories';

// Horizontally scrolling filter chips. Active chip is filled night indigo.
const CategoryPills = ({ active = 'all', onChange }) => (
  <div
    role="group"
    aria-label="Filter by category"
    className="flex items-center gap-2 overflow-x-auto scrollbar-none py-3"
  >
    {EVENT_CATEGORIES.map((cat) => {
      const isActive = active === cat.id;
      return (
        <button
          key={cat.id}
          type="button"
          aria-pressed={isActive}
          onClick={() => onChange(cat.id)}
          className={`shrink-0 whitespace-nowrap h-10 px-4 rounded-pill text-sm font-medium transition-colors ${isActive
              ? 'bg-night text-white'
              : 'bg-white text-ink/80 border border-mist hover:border-night/40'
          }`}
        >
          {cat.label}
        </button>
      );
    })}
  </div>
);

export default CategoryPills;