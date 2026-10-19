// src/components/layout/CityPicker.jsx
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
    const handleEscape = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
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
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="h-10 rounded-pill px-3.5 flex items-center gap-1.5 bg-moonlight text-sm text-ink hover:bg-night/10 transition-colors"
      >
        <MapPin size={15} className="text-night" />
        <span className="font-medium max-w-[7rem] truncate">{selectedCity.name}</span>
        <ChevronDown
          size={14}
          className={`text-night/50 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-mist bg-white shadow-card z-50 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-mist px-3 py-2.5">
            <Search size={14} className="text-night/50" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search city"
              aria-label="Search city"
              className="flex-1 text-sm focus:outline-none"
            />
          </div>

          <div role="listbox" className="max-h-72 overflow-y-auto py-1">
            {filteredCities.length === 0 && (
              <p className="px-4 py-3 text-sm text-gray-500">No city found</p>
            )}
            {filteredCities.map((city) => {
              const isSelected = city.name === selectedCity.name;
              return (
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  key={city.name}
                  onClick={() => handleSelect(city)}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${isSelected ? 'bg-night/5 text-night font-semibold' : 'text-ink hover:bg-moonlight'
                    }`}
                >
                  <span>{city.name}</span>
                  <span className="text-xs text-gray-500">{city.state}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CityPicker;