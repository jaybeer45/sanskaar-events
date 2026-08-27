// src/features/organizer/slices/organizerSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { organizerService } from '../../../services/organizer.service';

export const fetchMyOrganizer = createAsyncThunk('organizer/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const res = await organizerService.getMe();
    return res.data;
  } catch (err) {
    // 404 ka matlab hai "abhi register nahi kiya" — error nahi, normal state
    if (err.response?.status === 404) return null;
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const registerOrganizer = createAsyncThunk('organizer/register', async (data, { rejectWithValue }) => {
  try {
    const res = await organizerService.register(data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const submitKyc = createAsyncThunk('organizer/submitKyc', async ({ organizerId, data }, { rejectWithValue }) => {
  try {
    const res = await organizerService.submitKyc(organizerId, data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const sendContactOtp = createAsyncThunk('organizer/sendContactOtp', async ({ organizerId, field }, { rejectWithValue }) => {
  try {
    const res = await organizerService.sendContactOtp(organizerId, field);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const verifyContactOtp = createAsyncThunk('organizer/verifyContactOtp', async ({ organizerId, field, code }, { rejectWithValue }) => {
  try {
    const res = await organizerService.verifyContactOtp(organizerId, field, code);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

const initialState = {
  profile: null,        // organizer object, ya null agar registered nahi hai
  fetchStatus: 'idle',   // 'idle' | 'loading' | 'succeeded' | 'failed'
  registerStatus: 'idle',
  kycStatus: 'idle',
  error: null,
};

const organizerSlice = createSlice({
  name: 'organizer',
  initialState,
  reducers: {
    resetRegisterStatus: (s) => { s.registerStatus = 'idle'; s.error = null; },
    resetKycStatus: (s) => { s.kycStatus = 'idle'; s.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyOrganizer.pending,   (s) => { s.fetchStatus = 'loading'; })
      .addCase(fetchMyOrganizer.fulfilled, (s, a) => { s.fetchStatus = 'succeeded'; s.profile = a.payload; })
      .addCase(fetchMyOrganizer.rejected,  (s, a) => { s.fetchStatus = 'failed'; s.error = a.payload; })

      .addCase(registerOrganizer.pending,   (s) => { s.registerStatus = 'loading'; s.error = null; })
      .addCase(registerOrganizer.fulfilled, (s, a) => { s.registerStatus = 'succeeded'; s.profile = a.payload; })
      .addCase(registerOrganizer.rejected,  (s, a) => { s.registerStatus = 'failed'; s.error = a.payload; })

      .addCase(submitKyc.pending,   (s) => { s.kycStatus = 'loading'; s.error = null; })
      .addCase(submitKyc.fulfilled, (s, a) => { s.kycStatus = 'succeeded'; s.profile = a.payload; })
      .addCase(submitKyc.rejected,  (s, a) => { s.kycStatus = 'failed'; s.error = a.payload; })
      .addCase(verifyContactOtp.fulfilled, (s, a) => { s.profile = a.payload; });
  },
});

export const { resetRegisterStatus, resetKycStatus } = organizerSlice.actions;
export default organizerSlice.reducer;