import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getUserTotalCoins } from "../api/coinApi";

export const fetchUserCoins = createAsyncThunk(
  "coins/fetchUserCoins",
  async (userID, { rejectWithValue }) => {
    try {
      const response = await getUserTotalCoins(userID);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Error fetching coins");
    }
  }
);

const initialState = {
  total: 0,
  details: null, 
  shouldRefresh: false,
  lastUpdated: null,
  isInitialized: false,
  status: "idle",
};

const coinSlice = createSlice({
  name: "coins",
  initialState,
  reducers: {
    setInitialized: (state) => {
      state.isInitialized = true;
    },
    requestRefresh: (state) => {
      state.shouldRefresh = true;
      state.status = "loading";
    },
    completeRefresh: (state) => {
      state.shouldRefresh = false;
    },
    updateFromTransaction: (state, action) => {
      state.total = action.payload;
      state.lastUpdated = Date.now();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserCoins.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUserCoins.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.total = action.payload.totalCoins;
        state.details = action.payload; // store entire response
        state.lastUpdated = Date.now();
      })
      .addCase(fetchUserCoins.rejected, (state, action) => {
        state.status = "failed";
        console.error("Coin fetch error:", action.payload);
      });
  },
});

export const { setInitialized, requestRefresh, completeRefresh, updateFromTransaction } =
  coinSlice.actions;

export default coinSlice.reducer;
