import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import coinReducer from './coinSlice';
import videoReducer from './videoSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    coins: coinReducer,
    video: videoReducer
  },
  preloadedState: {
    coins: {
      total: 0,
      shouldRefresh: false,
      lastUpdated: null
    }
  }
});

export default store;