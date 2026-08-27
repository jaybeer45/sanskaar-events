// src/components/ui/EmptyState/EmptyState.jsx
const EmptyState = ({ icon = '🔍', title = 'Nothing here', message = '', action }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="text-6xl mb-4">{icon}</div>
    <h3 className="font-heading font-bold text-xl text-gray-700 mb-2">{title}</h3>
    {message && <p className="text-gray-500 text-sm max-w-xs">{message}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

export default EmptyState;
