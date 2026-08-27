import { createSlice } from '@reduxjs/toolkit';

// ✅ Major Indian cities — expand as needed
export const CITIES = [
  { name: 'Bareilly',      state: 'Uttar Pradesh',    lat: 28.3670, lng: 79.4304 },
  { name: 'Delhi',         state: 'Delhi',            lat: 28.6139, lng: 77.2090 },
  { name: 'Mumbai',        state: 'Maharashtra',      lat: 19.0760, lng: 72.8777 },
  { name: 'Bengaluru',     state: 'Karnataka',        lat: 12.9716, lng: 77.5946 },
  { name: 'Chennai',       state: 'Tamil Nadu',       lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata',       state: 'West Bengal',      lat: 22.5726, lng: 88.3639 },
  { name: 'Hyderabad',     state: 'Telangana',        lat: 17.3850, lng: 78.4867 },
  { name: 'Pune',          state: 'Maharashtra',      lat: 18.5204, lng: 73.8567 },
  { name: 'Ahmedabad',     state: 'Gujarat',          lat: 23.0225, lng: 72.5714 },
  { name: 'Jaipur',        state: 'Rajasthan',        lat: 26.9124, lng: 75.7873 },
  { name: 'Lucknow',       state: 'Uttar Pradesh',    lat: 26.8467, lng: 80.9462 },
  { name: 'Chandigarh',    state: 'Chandigarh',       lat: 30.7333, lng: 76.7794 },
  { name: 'Kochi',         state: 'Kerala',           lat: 9.9312,  lng: 76.2673 },
  { name: 'Indore',        state: 'Madhya Pradesh',   lat: 22.7196, lng: 75.8577 },
  { name: 'Bhopal',        state: 'Madhya Pradesh',   lat: 23.2599, lng: 77.4126 },
  { name: 'Surat',         state: 'Gujarat',          lat: 21.1702, lng: 72.8311 },
  { name: 'Nagpur',        state: 'Maharashtra',      lat: 21.1458, lng: 79.0882 },
  { name: 'Kanpur',        state: 'Uttar Pradesh',    lat: 26.4499, lng: 80.3319 },
  { name: 'Patna',         state: 'Bihar',            lat: 25.5941, lng: 85.1376 },
  { name: 'Agra',          state: 'Uttar Pradesh',    lat: 27.1767, lng: 78.0081 },
  { name: 'Varanasi',      state: 'Uttar Pradesh',    lat: 25.3176, lng: 82.9739 },
  { name: 'Nashik',        state: 'Maharashtra',      lat: 19.9975, lng: 73.7898 },
  { name: 'Vadodara',      state: 'Gujarat',          lat: 22.3072, lng: 73.1812 },
  { name: 'Coimbatore',    state: 'Tamil Nadu',       lat: 11.0168, lng: 76.9558 },
  { name: 'Guwahati',      state: 'Assam',            lat: 26.1445, lng: 91.7362 },
  { name: 'Ranchi',        state: 'Jharkhand',        lat: 23.3441, lng: 85.3096 },
  { name: 'Ludhiana',      state: 'Punjab',           lat: 30.9010, lng: 75.8573 },
  { name: 'Amritsar',      state: 'Punjab',           lat: 31.6340, lng: 74.8723 },
  { name: 'Dehradun',      state: 'Uttarakhand',      lat: 30.3165, lng: 78.0322 },
  { name: 'Noida',         state: 'Uttar Pradesh',    lat: 28.5355, lng: 77.3910 },
  { name: 'Gurugram',      state: 'Haryana',          lat: 28.4595, lng: 77.0266 },
];

const initialState = {
  selectedCity: CITIES[0],
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setCity: (state, action) => {
      state.selectedCity = action.payload;
    },
  },
});

export const { setCity } = locationSlice.actions;
export default locationSlice.reducer;