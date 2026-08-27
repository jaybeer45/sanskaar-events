// src/features/marketplace/slices/marketplaceSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { marketplaceService } from '../../../services/marketplace.service';

export const submitLeadRequest = createAsyncThunk('marketplace/submitLead', async (data, { rejectWithValue }) => {
  try {
    const res = await marketplaceService.submitLeadRequest(data);
    return res.data;
  } catch (err) { return rejectWithValue(err.message); }
});

export const approveVendor = createAsyncThunk('marketplace/approveVendor', async ({ reference, matchId }, { rejectWithValue }) => {
  try {
    await marketplaceService.approveMatch(reference, matchId);
    return matchId;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

const initialState = {
  selectedService: null,
  leadResult:      null,
  status:          'idle',
  error:           null,
};

const marketplaceSlice = createSlice({
  name: 'marketplace',
  initialState,
  reducers: {
    setSelectedService: (state, action) => { state.selectedService = action.payload; },
    resetLeadResult: (state) => { state.leadResult = null; state.status = 'idle'; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitLeadRequest.pending,   (s) => { s.status = 'loading'; })
      .addCase(submitLeadRequest.fulfilled, (s, a) => { s.status = 'succeeded'; s.leadResult = a.payload; })
      .addCase(submitLeadRequest.rejected,  (s, a) => { s.status = 'failed'; s.error = a.payload; })
      .addCase(approveVendor.fulfilled, (s, a) => {const vendor = s.leadResult?.matchedVendors?.find((v) => v.matchId === a.payload);
        if (vendor) vendor.approved = true;
      });
  },
});

export const { setSelectedService, resetLeadResult } = marketplaceSlice.actions;
export default marketplaceSlice.reducer;
