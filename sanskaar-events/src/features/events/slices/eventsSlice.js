// src/features/events/slices/eventsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { eventsService } from '../../../services/events.service';
import { adminService } from '../../../services/admin.service';

// ── Async Thunks ────────────────────────────────────────────
export const fetchEvents = createAsyncThunk('events/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const res = await eventsService.getAll(params);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchEventById = createAsyncThunk('events/fetchById', async (id, { rejectWithValue }) => {
  try {
    const res = await eventsService.getById(id);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchLiveNow = createAsyncThunk('events/fetchLiveNow', async (_, { rejectWithValue }) => {
  try {
    const res = await eventsService.getLiveNow();
    return res.data.results;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchTonight = createAsyncThunk('events/fetchTonight', async (_, { rejectWithValue }) => {
  try {
    const res = await eventsService.getTonight();
    return res.data.results;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const createEvent = createAsyncThunk('events/create', async (data, { rejectWithValue }) => {
  try {
    const res = await eventsService.create(data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

// Alias for Organizer page
export const submitEvent = createEvent;

// Admin thunks
export const fetchPendingEvents = createAsyncThunk('events/fetchPending', async (_, { rejectWithValue }) => {
  try {
    return await adminService.getPendingEvents();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const approveEvent = createAsyncThunk('events/approve', async (id, { rejectWithValue }) => {
  try {
    await adminService.approveEvent(id);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const rejectEvent = createAsyncThunk('events/reject', async (id, { rejectWithValue }) => {
  try {
    await adminService.rejectEvent(id);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

// ── Initial State ───────────────────────────────────────────
const initialState = {
  list:       [],
  detail:     null,
  liveNow:    [],
  tonight:    [],
  pending:    [],
  filters: {
    category:   'all',
    search:     '',
    date:       null,
    priceRange: [0, 10000],
    distance:   10,
  },
  pagination: { page: 1, hasMore: true, total: 0 },
  listStatus:    'idle',   // idle | loading | succeeded | failed
  detailStatus:  'idle',
  tonightStatus: 'idle',
  createStatus:  'idle',
  pendingStatus: 'idle',
  submitStatus:  'idle',
  error: null,
};

// ── Slice ───────────────────────────────────────────────────
const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    setFilter: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1;
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearDetail: (state) => {
      state.detail = null;
      state.detailStatus = 'idle';
    },
    resetCreateStatus: (state) => {
      state.createStatus = 'idle';
    },
    resetSubmitStatus: (state) => {
      state.submitStatus = 'idle';
      state.createStatus = 'idle';
    },
  },
  extraReducers: (builder) => {
    // fetchEvents
    builder
      .addCase(fetchEvents.pending,    (s) => { s.listStatus = 'loading'; s.error = null; })
      .addCase(fetchEvents.fulfilled,  (s, a) => {
        s.listStatus = 'succeeded';
        const results = a.payload.results ?? a.payload;
        const page = a.meta.arg?.page || 1;
        s.list = page === 1 ? results : [...s.list, ...results];
        s.pagination.page      = a.payload.page ?? page;
        s.pagination.total     = a.payload.total ?? s.list.length;
        s.pagination.totalPages = a.payload.totalPages ?? 1;
        s.pagination.hasMore   = (a.payload.page ?? page) < (a.payload.totalPages ?? 1);
      })
      .addCase(fetchEvents.rejected,   (s, a) => { s.listStatus = 'failed'; s.error = a.payload; });

    // fetchEventById
    builder
      .addCase(fetchEventById.pending,   (s) => { s.detailStatus = 'loading'; })
      .addCase(fetchEventById.fulfilled, (s, a) => { s.detailStatus = 'succeeded'; s.detail = a.payload; })
      .addCase(fetchEventById.rejected,  (s, a) => { s.detailStatus = 'failed'; s.error = a.payload; });

    // fetchLiveNow
    builder
      .addCase(fetchLiveNow.fulfilled, (s, a) => { s.liveNow = a.payload; });

    // fetchTonight
    builder
      .addCase(fetchTonight.pending,   (s) => { s.tonightStatus = 'loading'; })
      .addCase(fetchTonight.fulfilled, (s, a) => { s.tonightStatus = 'succeeded'; s.tonight = a.payload; })
      .addCase(fetchTonight.rejected,  (s, a) => { s.tonightStatus = 'failed'; s.error = a.payload; });

    // createEvent / submitEvent
    builder
      .addCase(createEvent.pending,   (s) => { s.createStatus = 'loading'; s.submitStatus = 'loading'; })
      .addCase(createEvent.fulfilled, (s) => { s.createStatus = 'succeeded'; s.submitStatus = 'succeeded'; })
      .addCase(createEvent.rejected,  (s, a) => { s.createStatus = 'failed'; s.submitStatus = 'failed'; s.error = a.payload; });

    // fetchPendingEvents
    builder
      .addCase(fetchPendingEvents.pending,   (s) => { s.pendingStatus = 'loading'; })
      .addCase(fetchPendingEvents.fulfilled, (s, a) => { s.pendingStatus = 'succeeded'; s.pending = a.payload; })
      .addCase(fetchPendingEvents.rejected,  (s, a) => { s.pendingStatus = 'failed'; s.error = a.payload; });

    // approveEvent
  builder
      .addCase(approveEvent.fulfilled, (s, a) => {
        s.pending = s.pending.filter(e => e.id !== a.payload);
      });

    // rejectEvent
    builder
      .addCase(rejectEvent.fulfilled, (s, a) => {
        s.pending = s.pending.filter(e => e.id !== a.payload);
      });
  },
});

export const { setFilter, resetFilters, clearDetail, resetCreateStatus, resetSubmitStatus } = eventsSlice.actions;
export default eventsSlice.reducer;
