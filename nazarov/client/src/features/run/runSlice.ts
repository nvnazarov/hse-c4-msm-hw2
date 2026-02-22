import {
  createAsyncThunk,
  createEntityAdapter,
  createSlice,
  EntityState,
} from "@reduxjs/toolkit";
import { RootState } from "../../app/store";

export interface Run {
  id: string;
  name: string;
  state_id: string;
  function_id: string;
  max_steps: number;
  n_agents: number;
  n_dims: number;
  low: number[];
  up: number[];
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

interface RunsState extends EntityState<Run, string> {
  status: "idle" | "pending" | "succeeded" | "rejected";
}

const initialState: RunsState = runAdapter.getInitialState({
  status: "idle",
});

const runSlice = createSlice({
  name: "runs",
  initialState: initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createRun.fulfilled, (state, action) => {
        runAdapter.addOne(state, action.payload);
        state.status = "succeeded";
      })
      .addCase(createRun.rejected, (state) => {
        state.status = "rejected";
      })
      .addCase(createRun.pending, (state) => {
        state.status = "pending";
      })
      .addCase(fetchRuns.fulfilled, (state, action) => {
        runAdapter.setAll(state, action.payload);
        state.status = "succeeded";
      })
      .addCase(fetchRuns.rejected, (state) => {
        state.status = "rejected";
      })
      .addCase(fetchRuns.pending, (state) => {
        state.status = "pending";
      })
      .addCase(deleteRun.fulfilled, (state, action) => {
        runAdapter.removeOne(state, action.payload);
        state.status = "succeeded";
      })
      .addCase(deleteRun.rejected, (state) => {
        state.status = "rejected";
      })
      .addCase(deleteRun.pending, (state) => {
        state.status = "pending";
      });
  },
});

const selectors = runAdapter.getSelectors<RootState>((state) => state.runs);

export const selectStatus = (state: RootState) => state.runs.status;
export const selectAllRuns = selectors.selectAll;
export const selectRunById = (id: string) => (state: RootState) =>
  selectors.selectById(state, id);

export default runSlice.reducer;
