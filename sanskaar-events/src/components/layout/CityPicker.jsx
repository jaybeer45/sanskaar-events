import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MapPin, ChevronDown, Search } from 'lucide-react';
import { CITIES, setCity } from '../../features/location/locationSlice';

const CityPicker = () => {
  const dispatch = useDispatch();
  const selectedCity = useSelector((s) => s.location.selectedCity);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCities = CITIES.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (city) => {
    dispatch(setCity(city));
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="hidden rounded-full px-4 md:flex items-center gap-1.5 border border-gray-300 py-1.5 text-sm text-gray-700 hover:border-gray-500 transition-colors"
      >
        <MapPin size={14} className="text-brand-red" />
        <span className="font-medium">{selectedCity.name}</span>
        <ChevronDown size={14} className="text-gray-400" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-64 rounded-xl border border-gray-200 bg-white shadow-lg z-50">
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
            <Search size={14} className="text-gray-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search city..."
              className="flex-1 text-sm focus:outline-none"
            />
          </div>

          <div className="max-h-72 overflow-y-auto py-1">
            {filteredCities.length === 0 && (
              <p className="px-4 py-3 text-sm text-gray-400">No city found</p>
            )}
            {filteredCities.map((city) => (
              <button
                key={city.name}
                onClick={() => handleSelect(city)}
                className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors ${
                  city.name === selectedCity.name
                    ? 'bg-red-50 text-brand-red font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{city.name}</span>
                <span className="text-xs text-gray-400">{city.state}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CityPicker;