import type { Action, ThunkAction } from "@reduxjs/toolkit";
import { configureStore } from "@reduxjs/toolkit";
import runReducer from "../features/run/runSlice";
import functionReducer from "../features/function/functionSlice";
import stateReducer from "../features/state/stateSlice";

export const store = configureStore({
  reducer: {
    runs: runReducer,
    functions: functionReducer,
    states: stateReducer,
  },
});

export type AppStore = typeof store;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
export type AppThunk<ThunkReturnType = void> = ThunkAction<
  ThunkReturnType,
  RootState,
  unknown,
  Action
>;
