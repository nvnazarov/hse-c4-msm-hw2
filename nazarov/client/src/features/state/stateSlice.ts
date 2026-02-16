import {
  createAsyncThunk,
  createEntityAdapter,
  createSlice,
  isAction,
} from "@reduxjs/toolkit";
import { RootState } from "../../app/store";

export interface State {
  id: string;
  run_id: string;
  step: number;
  visit_table: number[][];
  agents: number[];
  fitness: number[];
  created_at: string;
}

export const fetchStatesForRun = createAsyncThunk(
  "states/fetchForRun",
  async (runId: string) => {
    const resp = await fetch(`http://localhost:8080/runs/${runId}/states`);
    if (!resp.ok) {
      throw new Error("failed to load states");
    }
    const data = (await resp.json()) as State[];
    return data;
  },
);

export const startRun = createAsyncThunk(
  "states/startRun",
  async (runId: string) => {
    const resp = await fetch(`http://localhost:8080/runs/${runId}/start`, {
      method: "POST"
    });
    if (!resp.ok) {
      throw new Error("failed to start the run");
    }
    const data = (await resp.json()) as State;
    return data;
  },
);

export const doStep = createAsyncThunk(
  "states/doStep",
  async (runId: string) => {
    const resp = await fetch(`http://localhost:8080/runs/${runId}/step`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!resp.ok) {
      throw new Error("failed to step");
    }
    const data = (await resp.json()) as State;
    return data;
  },
);

export const runUntilFinish = createAsyncThunk(
  "states/runUntilFinish",
  async (runId: string) => {
    const resp = await fetch(
      `http://localhost:8080/runs/${runId}/run-until-finish`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    if (!resp.ok) {
      throw new Error("failed to run until finish");
    }
    const data = (await resp.json()) as State[];
    return data;
  },
);

const stateAdapter = createEntityAdapter<State, string>({
  selectId: (state) => state.id,
  sortComparer: (a, b) => a.step - b.step,
});

const stateSlice = createSlice({
  name: "states",
  initialState: stateAdapter.getInitialState(),
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(doStep.fulfilled, (state, action) => {
        stateAdapter.addOne(state, action.payload);
      })
      .addCase(runUntilFinish.fulfilled, (state, action) => {
        stateAdapter.addMany(state, action.payload);
      })
      .addCase(fetchStatesForRun.fulfilled, (state, action) => {
        stateAdapter.addMany(state, action.payload)
      })
      .addCase(startRun.fulfilled, (state, action) => {
        stateAdapter.addOne(state, action.payload)
      })
  },
});

const selectors = stateAdapter.getSelectors<RootState>((state) => state.states);

export const selectStatesByRunId = (id: string) => (state: RootState) => selectors.selectAll(state).filter(s => s.run_id == id);
export const selectStateById = (id: string) => (state: RootState) =>
  selectors.selectById(state, id);

export default stateSlice.reducer;
