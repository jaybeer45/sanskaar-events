





/// 
// src/pages/Home/components/HeroSection.jsx
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { ROUTES } from '../../../constants/routes';
import { useSelector } from 'react-redux';

const hashPosition = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const top = 15 + (Math.abs(hash) % 60);
  const left = 15 + (Math.abs(hash >> 3) % 60);
  return { top: `${top}%`, left: `${left}%` };
};

const HeroSection = ({ onSearch }) => {
  const selectedCity = useSelector((s) => s.location.selectedCity);
  const allEvents = useSelector((s) => s.events.list);

  const todayCount = allEvents.filter((e) =>
    e.isTonightEvent &&
    e.venue?.address?.toLowerCase().includes(selectedCity.name.toLowerCase())
  ).length;

  const cityEvents = allEvents.filter((e) =>
    e.venue?.address?.toLowerCase().includes(selectedCity.name.toLowerCase())
  );

  const areaDots = [...new Set(cityEvents.map((e) => e.venue?.address?.split(',')[0].trim()))]
    .filter(Boolean)
    .slice(0, 5)
    .map((locality) => ({ label: locality, ...hashPosition(locality) }));

  return (
    <section className="grid grid-cols-1 md:grid-cols-[57fr_43fr] min-h-[420px]">
      <div className="bg-brand-red text-white px-8 md:px-12 py-12 flex flex-col justify-center">
        <p className="text-[11px] font-bold uppercase tracking-widest opacity-70 mb-3">
          {selectedCity.name} · {selectedCity.state} · Today
        </p>
        <h1 className="font-black text-4xl md:text-5xl lg:text-6xl leading-[1.0] mb-5">
          What's on<br />
          <span className="text-white">around</span><br />
          <span style={{ WebkitTextStroke: '2px rgba(255,255,255,0.5)', color: 'transparent' }}>
            you today?
          </span>
        </h1>
        <p className="text-white/80 text-sm md:text-base leading-relaxed mb-8 max-w-xs">
          Live music, standup, food events, workshops and more — all happening in {selectedCity.name} tonight.
        </p>
        <Link
          to={ROUTES.TONIGHT}
          className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-brand-red font-black text-sm px-6 py-3.5 self-start transition-colors"
        >
          SHOW ME TONIGHT →
        </Link>
      </div>

      <Link
        to={ROUTES.MAP}
        className="relative hidden md:flex items-center justify-center min-h-[300px]"
        style={{
          backgroundImage: 'repeating-linear-gradient(135deg, #c8c8c8 0px, #c8c8c8 1px, #d4d4d4 1px, #d4d4d4 12px)',
          backgroundColor: '#d4d4d4',
        }}
      >
        {areaDots.map(({ top, left, label }) => (
          <div
            key={label}
            className="absolute flex flex-col items-center group cursor-pointer"
            style={{ top, left, transform: 'translate(-50%, -50%)' }}
          >
            <div className="w-3 h-3 rounded-full bg-brand-red border-2 border-white shadow-md group-hover:scale-125 transition-transform" />
            <span className="mt-1 bg-white text-[9px] font-bold text-gray-800 px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {label}
            </span>
          </div>
        ))}

        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white px-4 py-2 shadow-md">
          <MapPin size={13} className="text-brand-red" />
          <span className="text-sm font-bold text-gray-900">{selectedCity.name}, {selectedCity.state}</span>
          <span className="text-xs text-gray-400">· {todayCount} events today</span>
        </div>

        <div className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-widest text-gray-500">
          Area map
        </div>
      </Link>
    </section>
  );
};

export default HeroSection;