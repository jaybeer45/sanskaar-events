// src/features/vendors/slices/vendorsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { vendorsService } from '../../../services/vendors.service';

export const fetchVendors = createAsyncThunk('vendors/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const res = await vendorsService.getAll(params);
    return res.data;
  } catch (err) { return rejectWithValue(err.message); }
});

export const fetchVendorById = createAsyncThunk('vendors/fetchById', async (id, { rejectWithValue }) => {
  try {
    const res = await vendorsService.getById(id);
    return res.data;
  } catch (err) { return rejectWithValue(err.message); }
});

export const submitQuote = createAsyncThunk('vendors/submitQuote', async ({ vendorId, data }, { rejectWithValue }) => {
  try {
    const res = await vendorsService.requestQuote(vendorId, data);
    return res.data;
  } catch (err) { return rejectWithValue(err.message); }
});

const initialState = {
  list:        [],
  detail:      null,
  filters:     { category: 'all', search: '', minRating: 0, verified: false },
  listStatus:  'idle',
  detailStatus:'idle',
  quoteStatus: 'idle',
  error:       null,
};

const vendorsSlice = createSlice({
  name: 'vendors',
  initialState,
  reducers: {
    setVendorFilter: (state, action) => { state.filters = { ...state.filters, ...action.payload }; },
    clearVendorDetail: (state) => { state.detail = null; state.detailStatus = 'idle'; },
    resetQuoteStatus: (state) => { state.quoteStatus = 'idle'; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVendors.pending,    (s) => { s.listStatus = 'loading'; })
      .addCase(fetchVendors.fulfilled,  (s, a) => { s.listStatus = 'succeeded'; s.list = a.payload.results; })
      .addCase(fetchVendors.rejected,   (s, a) => { s.listStatus = 'failed'; s.error = a.payload; })
      .addCase(fetchVendorById.pending,   (s) => { s.detailStatus = 'loading'; })
      .addCase(fetchVendorById.fulfilled, (s, a) => { s.detailStatus = 'succeeded'; s.detail = a.payload; })
      .addCase(fetchVendorById.rejected,  (s, a) => { s.detailStatus = 'failed'; s.error = a.payload; })
      .addCase(submitQuote.pending,   (s) => { s.quoteStatus = 'loading'; })
      .addCase(submitQuote.fulfilled, (s) => { s.quoteStatus = 'succeeded'; })
      .addCase(submitQuote.rejected,  (s, a) => { s.quoteStatus = 'failed'; s.error = a.payload; });
  },
});

export const { setVendorFilter, clearVendorDetail, resetQuoteStatus } = vendorsSlice.actions;
export default vendorsSlice.reducer;
