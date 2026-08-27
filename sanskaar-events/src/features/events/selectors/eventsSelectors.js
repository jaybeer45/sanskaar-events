// src/features/events/selectors/eventsSelectors.js
import { createSelector } from '@reduxjs/toolkit';

const selectEventsState = (state) => state.events;

export const selectEventsList       = (state) => state.events.list;
export const selectEventDetail      = (state) => state.events.detail;
export const selectLiveNow          = (state) => state.events.liveNow;
export const selectTonight          = (state) => state.events.tonight;
export const selectEventsFilters    = (state) => state.events.filters;
export const selectEventsPagination = (state) => state.events.pagination;
export const selectListStatus       = (state) => state.events.listStatus;
export const selectDetailStatus     = (state) => state.events.detailStatus;
export const selectTonightStatus    = (state) => state.events.tonightStatus;
export const selectCreateStatus     = (state) => state.events.createStatus;
export const selectEventsError      = (state) => state.events.error;

// Memoized: filter events by active category
export const selectFilteredEvents = createSelector(
  [selectEventsList, selectEventsFilters],
  (list, filters) => {
    let result = list;
    if (filters.category && filters.category !== 'all')
      result = result.filter((e) => e.category === filters.category);
    if (filters.search)
      result = result.filter((e) =>
        e.title.toLowerCase().includes(filters.search.toLowerCase())
      );
    return result;
  }
);

export const selectTonightCount = createSelector(
  [selectTonight],
  (tonight) => tonight.length
);

export const selectPending       = (state) => state.events.pending;
export const selectPendingStatus = (state) => state.events.pendingStatus;
export const selectSubmitStatus  = (state) => state.events.submitStatus;

