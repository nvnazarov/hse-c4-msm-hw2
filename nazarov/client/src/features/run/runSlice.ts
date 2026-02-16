import {
  createAsyncThunk,
  createEntityAdapter,
  createSlice,
} from "@reduxjs/toolkit";
import { RootState } from "../../app/store";

export interface Run {
  id: string;
  name: string;
  state_id: string;
  function_id: string;
  visit_table: number[][];
  agents: number[][];
  fitness: number[];
  created_at: string;
}

export interface CreateRunPaylaod {
  function_id: string;
  name: string;
  n_agents: number;
  n_dims: number;
  max_steps: number;
  low: number[];
  up: number[];
}

export const createRun = createAsyncThunk(
  "runs/createRun",
  async (payload: CreateRunPaylaod) => {
    const resp = await fetch("http://localhost:8080/runs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      throw new Error("failed to create run");
    }
    const data = (await resp.json()) as Run;
    return data;
  },
);

export const fetchRuns = createAsyncThunk("runs/fetchRuns", async () => {
  const resp = await fetch("http://localhost:8080/runs");
  if (!resp.ok) {
    throw new Error("failed to fetch runs");
  }
  const data = (await resp.json()) as Run[];
  return data;
});

export const deleteRun = createAsyncThunk(
  "runs/deleteRun",
  async (id: string) => {
    const resp = await fetch(`http://localhost:8080/runs/${id}`, {
      method: "DELETE",
    });
    if (!resp.ok) {
      throw new Error("failed to delete the project");
    }
    return id;
  },
);

const runAdapter = createEntityAdapter<Run, string>({
  selectId: (run) => run.id,
  sortComparer: (a, b) => a.created_at.localeCompare(b.created_at),
});

const runSlice = createSlice({
  name: "runs",
  initialState: runAdapter.getInitialState(),
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createRun.fulfilled, (state, action) => {
        runAdapter.addOne(state, action.payload);
      })
      .addCase(fetchRuns.fulfilled, (state, action) => {
        runAdapter.setAll(state, action.payload);
      })
      .addCase(deleteRun.fulfilled, (state, action) => {
        runAdapter.removeOne(state, action.payload);
      });
  },
});

const selectors = runAdapter.getSelectors<RootState>((state) => state.runs);

export const selectAllRuns = selectors.selectAll;
export const selectRunById = (id: string) => (state: RootState) =>
  selectors.selectById(state, id);

export default runSlice.reducer;
