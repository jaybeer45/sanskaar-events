// src/features/events/hooks/useEvents.js
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEvents, fetchLiveNow, setFilter, resetFilters } from '../slices/eventsSlice';
import {
  selectFilteredEvents, selectLiveNow, selectListStatus,
  selectEventsFilters, selectEventsError,
} from '../selectors/eventsSelectors';

export const useEvents = () => {
  const dispatch = useDispatch();
  const events   = useSelector(selectFilteredEvents);
  const liveNow  = useSelector(selectLiveNow);
  const status   = useSelector(selectListStatus);
  const filters  = useSelector(selectEventsFilters);
  const error    = useSelector(selectEventsError);

  useEffect(() => {
    dispatch(fetchEvents(filters));
    dispatch(fetchLiveNow());
  }, [dispatch, filters.category, filters.search]);

  const updateFilter = (payload) => dispatch(setFilter(payload));
  const clearFilters = () => dispatch(resetFilters());

  return { events, liveNow, status, filters, error, updateFilter, clearFilters };
};
