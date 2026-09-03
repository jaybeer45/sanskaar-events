// src/features/auth/slices/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../../services/auth.service';

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const res = await authService.login(credentials);
    localStorage.setItem('sanskaar_token', res.data.token);
    return res.data;
  } catch (err) { return rejectWithValue(err.message); }
});

export const otpLogin = createAsyncThunk('auth/otpLogin', async ({ identifier, code }, { rejectWithValue }) => {
  try {
    const res = await authService.otpLogin(identifier, code);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'OTP login failed.');
  }
});

export const register = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await authService.register(data);
    localStorage.setItem('sanskaar_token', res.data.token);
    return res.data;
  } catch (err) { return rejectWithValue(err.message); }
});

export const fetchProfile = createAsyncThunk('auth/fetchProfile', async (_, { rejectWithValue }) => {
  try {
    const res = await authService.getProfile();
    return res.data;
  } catch (err) { return rejectWithValue(err.message); }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (data, { getState, rejectWithValue }) => {
  try {
   const userId = getState().auth.user?._id;
    const res = await authService.updateProfile(userId, data);
    return res.data;
  } catch (err) { return rejectWithValue(err.message); }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('sanskaar_token');
  return null;
});

const initialState = {
  user: null,
  roles: ['visitor'],
  token: localStorage.getItem('sanskaar_token') || null,
  savedEvents: [],
  status: 'idle',
  error: null,
  authStatus: localStorage.getItem('sanskaar_token') ? 'checking' : 'idle',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setRoles: (state, action) => { state.roles = action.payload; },
    toggleSaveEvent: (state, action) => {
      const id = action.payload;
      const idx = state.savedEvents.indexOf(id);
      if (idx >= 0) state.savedEvents.splice(idx, 1);
      else state.savedEvents.push(id);
    },
    clearAuthError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (s) => { s.status = 'loading'; s.error = null; })
      .addCase(login.fulfilled, (s, a) => { s.status = 'succeeded'; s.user = a.payload.user; s.roles = a.payload.user.roles?.length ? a.payload.user.roles : ['user']; s.token = a.payload.token; })
      .addCase(login.rejected, (s, a) => { s.status = 'failed'; s.error = a.payload; })
      .addCase(otpLogin.pending, (s) => { s.status = 'loading'; s.error = null; })
      .addCase(otpLogin.fulfilled, (s, a) => { s.status = 'succeeded'; s.user = a.payload.user; s.roles = a.payload.user.roles?.length ? a.payload.user.roles : ['user']; s.token = a.payload.token; })
      .addCase(otpLogin.rejected, (s, a) => { s.status = 'failed'; s.error = a.payload; })
      .addCase(register.fulfilled, (s, a) => { s.user = a.payload.user; s.roles = a.payload.user.roles?.length ? a.payload.user.roles : ['user']; s.token = a.payload.token; s.status = 'succeeded'; })
      .addCase(fetchProfile.fulfilled, (s, a) => {
        s.user = a.payload; s.roles = a.payload.roles?.length ? a.payload.roles : ['user']; s.status = 'succeeded'; s.authStatus = 'done';
      })
      .addCase(fetchProfile.rejected, (s) => {
        s.user = null; s.roles = ['visitor']; s.token = null; s.authStatus = 'done'; localStorage.removeItem('sanskaar_token');
      })
      .addCase(updateProfile.fulfilled, (s, a) => { s.user = a.payload; })
      .addCase(logout.fulfilled, (s) => { s.user = null; s.roles = ['visitor']; s.token = null; s.savedEvents = []; s.status = 'idle'; s.authStatus = 'idle'; });  },
});

export const { setRoles, toggleSaveEvent, clearAuthError } = authSlice.actions;
export default authSlice.reducer;