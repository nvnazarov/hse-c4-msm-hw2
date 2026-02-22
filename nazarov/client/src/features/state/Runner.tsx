import { ChangeEvent, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import "./Runner.css";
import {
  doStep,
  fetchStatesForRun,
  runUntilFinish,
  selectStatesByRunId,
  startRun,
} from "./stateSlice";
import { VisitTable } from "./VIsitTable";
import { selectRunById, selectStatus } from "../run/runSlice";
import { FitnessChart } from "./FitnessChart";
import { AgentsChart } from "./AgentsChart";
import { Navigate } from "react-router-dom";
import { selectAllFunctions } from "../function/functionSlice";
import { FoodSourcesTable } from "./FoodSourcesTable";

export interface Props {
  runId: string;
}

export function Runner({ runId }: Props) {
  const dispatch = useAppDispatch();
  const functions = useAppSelector(selectAllFunctions);
  const run = useAppSelector(selectRunById(runId));
  const runsStatus = useAppSelector(selectStatus);
  const states = useAppSelector((state) => selectStatesByRunId(state, runId));
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    async function fetchStates() {
      try {
        setBusy(true);
        await dispatch(fetchStatesForRun(runId));
      } finally {
        setBusy(false);
      }
    }
    fetchStates();
  }, [dispatch, runId]);

  async function handleStartClick() {
    try {
      setBusy(true);
      await dispatch(startRun(runId));
    } finally {
      setBusy(false);
    }
  }

  async function handleStepClick() {
    try {
      setBusy(true);
      await dispatch(doStep(runId))
        .unwrap()
        .then((state) => setStep(state.step));
    } finally {
      setBusy(false);
    }
  }

  async function handleRunUntilFinishClick(e: any) {
    try {
      setBusy(true);
      await dispatch(runUntilFinish(runId))
        .unwrap()
        .then((states) => {
          if (states.length > 0) {
            setStep(states[states.length - 1]!.step);
          }
        });
    } finally {
      setBusy(false);
    }
  }

  function handleBackwardClick(e: any) {
    setStep(step === 0 ? 0 : step - 1);
  }

  function handleForwardClick(e: any) {
    if (step >= states.length - 1) {
      return;
    }
    setStep(step + 1);
  }

  function handleStepChange(e: ChangeEvent<HTMLInputElement>) {
    if (!run) {
      return;
    }
    let v = +e.target.value;
    if (v >= states.length) {
      v = states.length - 1;
    }
    if (v < 0) {
      v = 0;
    }
    setStep(v);
  }

  if (runsStatus === "succeeded" && run === undefined) {
    return <Navigate to="/" />;
  }

  if (run === undefined) {
    return <div className="runner">Loading.</div>;
  }

  const isStarted = states.length > 0;
  const state = isStarted ? states[step] : undefined;
  const isMaxStepsReached =
    states.length > 0 && states[states.length - 1]!.step === run.max_steps;
  const canForward = step < states.length - 1;
  const canStep = isStarted && !isMaxStepsReached && !busy;

  return (
    <div className={"runner" + (busy ? " runner__pending" : "")}>
      <p>
        Run "{run.name}" ({run.id.slice(0, 8)})
      </p>
      <hr />
      <div className="runner__actions">
        <button
          onClick={handleStartClick}
          disabled={isStarted || busy}
          title={isStarted ? "Run is already started" : undefined}
        >
          Start
        </button>
        <button
          onClick={handleStepClick}
          disabled={!canStep}
          title={isMaxStepsReached ? "Max steps reached" : undefined}
        >
          Step
        </button>
        <button
          onClick={handleRunUntilFinishClick}
          disabled={!isStarted || isMaxStepsReached || busy}
          title={isMaxStepsReached ? "Max steps reached" : undefined}
        >
          Run until finish
        </button>
        <button
          onClick={handleBackwardClick}
          title="Backward"
          disabled={busy || step === 0}
        >
          {"<<"}
        </button>
        <input
          type="number"
          value={state ? state.step : 0}
          onChange={handleStepChange}
        />
        <button
          onClick={handleForwardClick}
          title="Forward"
          disabled={busy || !canForward}
        >
          {">>"}
        </button>
      </div>
      <hr />
      {run && (
        <>
          Agents: {run.n_agents}; Dimensions: {run.n_dims}; Function:{" "}
          {functions.find((f) => f.id === run.function_id)?.name}
        </>
      )}
      <hr />
      <div className="runner__subplots">
        {state && <VisitTable vt={state.visit_table} />}
        {state && <FoodSourcesTable state={state} />}
        <FitnessChart states={states} />
        <AgentsChart run={run} step={step} states={states} />
      </div>
    </div>
  );
}
