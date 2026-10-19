// src/components/ui/SkeletonCard/SkeletonCard.jsx
// Loading placeholder shaped like the ticket card
const SkeletonCard = () => (
  <div className="ticket">
    <div className="skeleton h-44 w-full !rounded-none" />
    <div className="ticket-perf" />
    <div className="p-4 space-y-3">
      <div className="skeleton h-5 w-3/4" />
      <div className="skeleton h-4 w-1/2" />
      <div className="skeleton h-9 w-full" />
    </div>
  </div>
);

export const SkeletonGrid = ({ count = 6 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
    {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
  </div>
);

export default SkeletonCard;