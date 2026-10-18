import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchSavedInvestigations = createAsyncThunk(
  'investigationsList/fetchSaved',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch('/api/v1/investigations');
      if (!res.ok) throw new Error('Failed to fetch investigations list');
      return await res.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteInvestigationById = createAsyncThunk(
  'investigationsList/deleteById',
  async (id, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/v1/investigations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete investigation');
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const investigationsListSlice = createSlice({
  name: 'investigationsList',
  initialState: {
    items: [],
    loading: false,
    error: null,
    isModalOpen: false,
  },
  reducers: {
    toggleModal: (state) => {
      state.isModalOpen = !state.isModalOpen;
    },
    setModalOpen: (state, action) => {
      state.isModalOpen = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSavedInvestigations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSavedInvestigations.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchSavedInvestigations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteInvestigationById.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload);
      });
  },
});

export const { toggleModal, setModalOpen } = investigationsListSlice.actions;
export default investigationsListSlice.reducer;
