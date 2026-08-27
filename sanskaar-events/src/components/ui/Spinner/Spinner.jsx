// src/components/ui/Spinner/Spinner.jsx
const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };

const Spinner = ({ size = 'md', className = '' }) => (
  <div className={`${sizes[size]} ${className} animate-spin rounded-full border-4 border-gray-200 border-t-brand-red`} />
);

export default Spinner;
