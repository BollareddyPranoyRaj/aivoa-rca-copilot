import { configureStore } from '@reduxjs/toolkit';
import investigationReducer from './slices/investigationSlice';
import copilotReducer from './slices/copilotSlice';
import investigationsListReducer from './slices/investigationsListSlice';

export const store = configureStore({
  reducer: {
    investigation: investigationReducer,
    copilot: copilotReducer,
    investigationsList: investigationsListReducer,
  },
});

export default store;
