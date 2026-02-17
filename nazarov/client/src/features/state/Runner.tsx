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
import { selectRunById } from "../run/runSlice";
import { FitnessChart } from "./FitnessChart";
import { AgentsChart } from "./AgentsChart";

export interface Props {
  runId: string;
}

export function Runner({ runId }: Props) {
  const dispatch = useAppDispatch();
  const run = useAppSelector(selectRunById(runId));
  const states = useAppSelector((state) => selectStatesByRunId(state, runId));
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    async function prefetch() {
      try {
        setBusy(true);
        await dispatch(fetchStatesForRun(runId));
      } finally {
        setBusy(false);
      }
    }
    prefetch();
  }, [dispatch, runId]);

  async function handleStartClick(e: any) {
    try {
      setBusy(true);
      await dispatch(startRun(runId));
    } finally {
      setBusy(false);
    }
  }

  async function handleStepClick(e: any) {
    try {
      setBusy(true);
      await dispatch(doStep(runId)).then(() => setStep(step + 1));
    } finally {
      setBusy(false);
    }
  }

  async function handleRunUntilFinishClick(e: any) {
    try {
      setBusy(true);
      await dispatch(runUntilFinish(runId));
    } finally {
      setBusy(false);
    }
  }

  function handleBackwardClick(e: any) {
    setStep(step === 0 ? 0 : step - 1);
  }

  function handleForwardClick(e: any) {
    setStep(step + 1);
  }

  function handleStepChange(e: ChangeEvent<HTMLInputElement>) {
    if (!run) {
      return;
    }
    let v = +e.target.value;
    if (v >= run.max_steps) {
      v = run.max_steps;
    }
    if (v < 0) {
      v = 0;
    }
    setStep(v);
  }

  const isStarted = states.length > 0;
  const state = isStarted ? states[step] : undefined;
  const lastState = states.find((state) => state.id === run?.state_id);
  const isMaxStepsReached = lastState?.step === run?.max_steps;

  return (
    <div className="runner">
      <p>
        Run "{run?.name}" ({runId.slice(0, 8)})
      </p>
      <hr />
      <div className="runner__actions">
        <button
          onClick={handleStartClick}
          disabled={isStarted || busy}
          title={isStarted ? "run is already started" : undefined}
        >
          Start
        </button>
        <button
          onClick={handleStepClick}
          disabled={!isStarted || isMaxStepsReached || busy}
          title={isMaxStepsReached ? "max steps reached" : undefined}
        >
          Step
        </button>
        <button
          onClick={handleRunUntilFinishClick}
          disabled={!isStarted || isMaxStepsReached || busy}
          title={isMaxStepsReached ? "max steps reached" : undefined}
        >
          Run until finish
        </button>
        <button
          onClick={handleBackwardClick}
          title="backward"
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
          title="forward"
          disabled={busy || step === run?.max_steps}
        >
          {">>"}
        </button>
      </div>
      <hr />
      {run && (
        <>
          Agents: {run.n_agents}; Dimensions: {run.n_dims}; Function: {}
        </>
      )}
      <hr />
      <div className="runner__subplots">
        {isStarted && <VisitTable vt={state!.visit_table} />}
        <FitnessChart states={states} />
        {run && <AgentsChart run={run} step={step} states={states} />}
      </div>
    </div>
  );
}
