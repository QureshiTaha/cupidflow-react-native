import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentVideoId: null,
  shouldPauseAll: false,
  playingVideos: [] 
};

const videoSlice = createSlice({
  name: 'video',
  initialState,
  reducers: {
    setCurrentVideo: (state, action) => {
      state.currentVideoId = action.payload;
      state.shouldPauseAll = false;
      if (!state.playingVideos.includes(action.payload)) {
        state.playingVideos.push(action.payload);
      }
    },
    pauseAllVideos: (state) => {
      state.shouldPauseAll = true;
      state.currentVideoId = null;
      state.playingVideos = [];
    },
    resetVideoState: (state) => {
      state.shouldPauseAll = false;
      state.currentVideoId = null;
    },
    removePlayingVideo: (state, action) => {
      state.playingVideos = state.playingVideos.filter(id => id !== action.payload);
    }
  }
});

export const { setCurrentVideo, pauseAllVideos, resetVideoState, removePlayingVideo } = videoSlice.actions;
export default videoSlice.reducer;