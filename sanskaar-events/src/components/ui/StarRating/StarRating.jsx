// src/components/ui/StarRating/StarRating.jsx
import { Star } from 'lucide-react';

const StarRating = ({ rating = 0, count, size = 14 }) => {
  const stars = Array.from({ length: 5 });
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {stars.map((_, i) => (
          <Star
            key={i}
            size={size}
            className={i < Math.round(rating) ? 'fill-brand-gold text-brand-gold' : 'text-gray-300 fill-gray-300'}
          />
        ))}
      </div>
      <span className="text-sm font-semibold text-gray-700">{rating.toFixed(1)}</span>
      {count !== undefined && <span className="text-xs text-gray-400">({count})</span>}
    </div>
  );
};

export default StarRating;
