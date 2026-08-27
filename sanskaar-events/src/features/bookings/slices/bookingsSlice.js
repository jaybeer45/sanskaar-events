// src/features/bookings/slices/bookingsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { bookingsService } from '../../../services/bookings.service';

export const createBooking = createAsyncThunk(
  'bookings/create',
  async (bookingData, { rejectWithValue }) => {
    try {
      const res = await bookingsService.create(bookingData);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const createRazorpayOrder = createAsyncThunk(
  'bookings/createRazorpayOrder',
  async (bookingId, { rejectWithValue }) => {
    try {
      const res = await bookingsService.createOrder(bookingId);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const verifyRazorpayPayment = createAsyncThunk(
  'bookings/verifyRazorpayPayment',
  async ({ bookingId, razorpayResponse }, { rejectWithValue }) => {
    try {
      const res = await bookingsService.verifyPayment(bookingId, razorpayResponse);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchMyBookings = createAsyncThunk(
  'bookings/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      const res = await bookingsService.getMy();
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Bookings load nahi ho payi.');
    }
  }
);

const bookingsSlice = createSlice({
  name: 'bookings',
initialState: { status: 'idle', paymentStatus: 'idle', error: null, lastBooking: null, razorpayOrder: null, myBookings: [], myBookingsStatus: 'idle' },
  reducers: {
    resetBookingStatus: (state) => {
      state.status = 'idle';
      state.paymentStatus = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createRazorpayOrder.pending, (state) => { state.paymentStatus = 'loading'; state.error = null; })
      .addCase(createRazorpayOrder.fulfilled, (state, action) => { state.razorpayOrder = action.payload; })
      .addCase(createRazorpayOrder.rejected, (state, action) => { state.paymentStatus = 'failed'; state.error = action.payload; })
      .addCase(verifyRazorpayPayment.pending, (state) => { state.paymentStatus = 'loading'; state.error = null; })
      .addCase(verifyRazorpayPayment.fulfilled, (state, action) => {
        state.paymentStatus = 'succeeded';
        state.lastBooking = { ...state.lastBooking, ...action.payload };  
      })
      .addCase(verifyRazorpayPayment.rejected, (state, action) => { state.paymentStatus = 'failed'; state.error = action.payload; })
      .addCase(fetchMyBookings.pending, (state) => { state.myBookingsStatus = 'loading'; })
      .addCase(fetchMyBookings.fulfilled, (state, action) => {
        state.myBookingsStatus = 'succeeded';
        state.myBookings = action.payload.results || [];
      })
      .addCase(fetchMyBookings.rejected, (state, action) => { state.myBookingsStatus = 'failed'; state.error = action.payload; });
  },
});

export const { resetBookingStatus } = bookingsSlice.actions;
export default bookingsSlice.reducer;