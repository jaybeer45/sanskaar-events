// src/hooks/useGeolocation.js
import { useState, useEffect } from 'react';

export const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);

  const getLocation = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      (err) => { setError(err.message); setLoading(false); }
    );
  };

  useEffect(() => { getLocation(); }, []);

  return { location, error, loading, retry: getLocation };
};
