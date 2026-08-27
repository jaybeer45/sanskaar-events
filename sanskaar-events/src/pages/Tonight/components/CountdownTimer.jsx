// src/pages/Tonight/components/CountdownTimer.jsx
import { useState, useEffect } from 'react';

const CountdownTimer = ({ targetTime, targetDate }) => {
  const getTimeLeft = () => {
    const target = new Date(`${targetDate}T${convertTo24(targetTime)}`);
    const diff   = target - new Date();
    if (diff <= 0) return null;
    return {
      h: Math.floor(diff / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    };
  };

  const convertTo24 = (time12) => {
    const [time, modifier] = time12.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
    return `${hours}:${minutes}:00`;
  };

  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!timeLeft) return <span className="text-green-400 font-bold text-sm">🔴 Live Now</span>;

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className="flex items-center gap-1 font-heading font-bold text-white">
      {timeLeft.h > 0 && (
        <><span className="bg-white/20 rounded-lg px-2.5 py-1.5 text-xl">{pad(timeLeft.h)}</span><span className="text-gray-400 text-sm">h</span></>
      )}
      <span className="bg-white/20 rounded-lg px-2.5 py-1.5 text-xl">{pad(timeLeft.m)}</span>
      <span className="text-gray-400 text-sm">m</span>
      <span className="bg-white/20 rounded-lg px-2.5 py-1.5 text-xl">{pad(timeLeft.s)}</span>
      <span className="text-gray-400 text-sm">s</span>
    </div>
  );
};

export default CountdownTimer;
