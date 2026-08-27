// src/features/admin/slices/adminSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminService } from '../../../services/admin.service';

export const fetchAdminStats        = createAsyncThunk('admin/stats',           async (_, { rejectWithValue }) => { try { return (await adminService.getStats()).data; } catch (e) { return rejectWithValue(e.message); } });
export const fetchPendingEvents     = createAsyncThunk('admin/pendingEvents',    async (_, { rejectWithValue }) => { try { return (await adminService.getPendingEvents()).data.results; } catch (e) { return rejectWithValue(e.message); } });
export const approveEvent           = createAsyncThunk('admin/approveEvent',     async (id, { rejectWithValue }) => { try { return (await adminService.approveEvent(id)).data; } catch (e) { return rejectWithValue(e.message); } });
export const rejectEvent            = createAsyncThunk('admin/rejectEvent',      async ({ id, reason }, { rejectWithValue }) => { try { return (await adminService.rejectEvent(id, reason)).data; } catch (e) { return rejectWithValue(e.message); } });
export const fetchPendingVendors    = createAsyncThunk('admin/pendingVendors',   async (_, { rejectWithValue }) => { try { return (await adminService.getPendingVendors()).data.results; } catch (e) { return rejectWithValue(e.message); } });
export const verifyVendor           = createAsyncThunk('admin/verifyVendor',     async (id, { rejectWithValue }) => { try { return (await adminService.verifyVendor(id)).data; } catch (e) { return rejectWithValue(e.message); } });

const initialState = {
  stats:           null,
  pendingEvents:   [],
  pendingVendors:  [],
  statsStatus:     'idle',
  eventsStatus:    'idle',
  vendorsStatus:   'idle',
  error:           null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminStats.fulfilled,     (s, a) => { s.stats = a.payload; s.statsStatus = 'succeeded'; })
      .addCase(fetchPendingEvents.pending,    (s) => { s.eventsStatus = 'loading'; })
      .addCase(fetchPendingEvents.fulfilled,  (s, a) => { s.eventsStatus = 'succeeded'; s.pendingEvents = a.payload; })
      .addCase(approveEvent.fulfilled,        (s, a) => { s.pendingEvents = s.pendingEvents.filter((e) => e.id !== a.payload.id); })
      .addCase(rejectEvent.fulfilled,         (s, a) => { s.pendingEvents = s.pendingEvents.filter((e) => e.id !== a.payload.id); })
      .addCase(fetchPendingVendors.fulfilled, (s, a) => { s.pendingVendors = a.payload; s.vendorsStatus = 'succeeded'; })
      .addCase(verifyVendor.fulfilled,        (s, a) => { s.pendingVendors = s.pendingVendors.filter((v) => v.id !== a.payload.id); });
  },
});

export default adminSlice.reducer;
