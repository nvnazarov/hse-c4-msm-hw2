import {
  createAsyncThunk,
  createEntityAdapter,
  createSlice,
} from "@reduxjs/toolkit";
import { RootState } from "../../app/store";

export interface Function {
  id: string;
  name: string;
}

export const fetchFunctions = createAsyncThunk(
  "functions/fetchFunctions",
  async () => {
    const resp = await fetch("http://localhost:8080/functions");
    if (!resp.ok) {
      throw new Error("failed to fetch functions");
    }
    const data = (await resp.json()) as Function[];
    return data;
  },
);

const functionAdapter = createEntityAdapter<Function, string>({
  selectId: (f) => f.id,
  sortComparer: (a, b) => a.id.localeCompare(b.id),
});

const functionSlice = createSlice({
  name: "functions",
  initialState: functionAdapter.getInitialState(),
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchFunctions.fulfilled, (state, action) => {
      functionAdapter.setAll(state, action.payload);
    });
  },
});

const selectors = functionAdapter.getSelectors<RootState>(
  (state) => state.functions,
);

export const selectAllFunctions = selectors.selectAll;

export default functionSlice.reducer;
