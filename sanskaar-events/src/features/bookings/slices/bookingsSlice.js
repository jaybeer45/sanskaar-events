// src/features/bookings/slices/bookingsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { bookingsService } from '../../../services/bookings.service';

export const createBooking = createAsyncThunk(
  'bookings/create',
  async (bookingData, { rejectWithValue }) => {
    try {
      const res = await bookingsService.create(bookingData);
      return res.data.booking || res.data; // unwrap the { success, booking } shape
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

export const cancelBooking = createAsyncThunk(
  'bookings/cancel',
  async (bookingId, { rejectWithValue }) => {
    try {
      const res = await bookingsService.cancel(bookingId);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Cancel nahi ho paya.');
    }
  }
);

export const rescheduleBooking = createAsyncThunk(
  'bookings/reschedule',
  async ({ bookingId, newEventDateId }, { rejectWithValue }) => {
    try {
      const res = await bookingsService.reschedule(bookingId, newEventDateId);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Reschedule nahi ho paya.');
    }
  }
);

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState: {
    status: 'idle',
    paymentStatus: 'idle',
    error: null,
    lastBooking: null,
    razorpayOrder: null,
    myBookings: [],
    myBookingsStatus: 'idle',
  },
  reducers: {
    resetBookingStatus: (state) => {
      state.status = 'idle';
      state.paymentStatus = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── createBooking ──────────────────────────────
      .addCase(createBooking.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.lastBooking = action.payload;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // ── createRazorpayOrder ─────────────────────────
      .addCase(createRazorpayOrder.pending, (state) => { state.paymentStatus = 'loading'; state.error = null; })
      .addCase(createRazorpayOrder.fulfilled, (state, action) => { state.razorpayOrder = action.payload; })
      .addCase(createRazorpayOrder.rejected, (state, action) => { state.paymentStatus = 'failed'; state.error = action.payload; })

      // ── verifyRazorpayPayment ───────────────────────
      .addCase(verifyRazorpayPayment.pending, (state) => { state.paymentStatus = 'loading'; state.error = null; })
      .addCase(verifyRazorpayPayment.fulfilled, (state, action) => {
        state.paymentStatus = 'succeeded';
        state.lastBooking = { ...state.lastBooking, ...action.payload };
      })
      .addCase(verifyRazorpayPayment.rejected, (state, action) => { state.paymentStatus = 'failed'; state.error = action.payload; })

      // ── fetchMyBookings ─────────────────────────────
      .addCase(fetchMyBookings.pending, (state) => { state.myBookingsStatus = 'loading'; })
      .addCase(fetchMyBookings.fulfilled, (state, action) => {
        state.myBookingsStatus = 'succeeded';
        state.myBookings = action.payload.results || [];
      })
      .addCase(fetchMyBookings.rejected, (state, action) => { state.myBookingsStatus = 'failed'; state.error = action.payload; })

      // ── cancelBooking ───────────────────────────────
      .addCase(cancelBooking.pending, (state) => { state.myBookingsStatus = 'loading'; state.error = null; })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.myBookingsStatus = 'succeeded';
        const updated = action.payload.booking; // backend sends { success, booking }
        state.myBookings = state.myBookings.map((b) =>
          b._id === updated._id ? { ...b, ...updated } : b
        );
      })
      .addCase(cancelBooking.rejected, (state, action) => { state.myBookingsStatus = 'failed'; state.error = action.payload; })

      // ── rescheduleBooking ───────────────────────────
      .addCase(rescheduleBooking.pending, (state) => { state.myBookingsStatus = 'loading'; state.error = null; })
      .addCase(rescheduleBooking.fulfilled, (state, action) => {
        state.myBookingsStatus = 'succeeded';
        const updated = action.payload.booking; // backend sends { success, booking }
        state.myBookings = state.myBookings.map((b) =>
          b._id === updated._id ? { ...b, ...updated } : b
        );
      })
      .addCase(rescheduleBooking.rejected, (state, action) => { state.myBookingsStatus = 'failed'; state.error = action.payload; });
  },
});

export const { resetBookingStatus } = bookingsSlice.actions;
export default bookingsSlice.reducer;