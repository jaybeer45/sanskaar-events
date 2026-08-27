// src/features/ui/slices/uiSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  theme:       'light',       // 'light' | 'dark'
  activeModal: null,          // modal id string or null
  isMobileMenuOpen: false,
  globalLoading:    false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', state.theme === 'dark');
    },
    openModal:   (state, action) => { state.activeModal = action.payload; },
    closeModal:  (state) => { state.activeModal = null; },
    toggleMobileMenu: (state) => { state.isMobileMenuOpen = !state.isMobileMenuOpen; },
    setGlobalLoading: (state, action) => { state.globalLoading = action.payload; },
  },
});

export const { toggleTheme, openModal, closeModal, toggleMobileMenu, setGlobalLoading } = uiSlice.actions;
export default uiSlice.reducer;
