// src/app/store.js
import { configureStore } from '@reduxjs/toolkit';
import eventsReducer      from '../features/events/slices/eventsSlice';
import vendorsReducer     from '../features/vendors/slices/vendorsSlice';
import authReducer        from '../features/auth/slices/authSlice';
import marketplaceReducer from '../features/marketplace/slices/marketplaceSlice';
import adminReducer       from '../features/admin/slices/adminSlice';
import uiReducer          from '../features/ui/slices/uiSlice';
import locationReducer from '../features/location/locationSlice'
import bookingsReducer from '../features/bookings/slices/bookingsSlice';
import organizerReducer from '../features/organizer/slices/organizerSlice';

const store = configureStore({
  reducer: {
    events:      eventsReducer,
    vendors:     vendorsReducer,
    marketplace: marketplaceReducer,
    admin:       adminReducer,
    ui:          uiReducer,
   auth: authReducer,
  location: locationReducer,
  bookings: bookingsReducer,
   organizer: organizerReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
  devTools: import.meta.env.DEV,
});

export default store;
