// src/features/events/hooks/useEventDetail.js
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEventById, clearDetail } from '../slices/eventsSlice';
import { selectEventDetail, selectDetailStatus, selectEventsError } from '../selectors/eventsSelectors';

export const useEventDetail = (id) => {
  const dispatch = useDispatch();
  const event  = useSelector(selectEventDetail);
  const status = useSelector(selectDetailStatus);
  const error  = useSelector(selectEventsError);

  useEffect(() => {
    if (id) dispatch(fetchEventById(id));
    return () => dispatch(clearDetail());
  }, [dispatch, id]);

  return { event, status, error };
};
