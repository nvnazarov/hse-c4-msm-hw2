import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import "./Runner.css";
import {
  doStep,
  fetchStatesForRun,
  selectStatesByRunId,
  startRun,
} from "./stateSlice";
import { VisitTable } from "./VIsitTable";

export interface Props {
  runId: string;
}

export function Runner({ runId }: Props) {
  const dispatch = useAppDispatch();
  const states = useAppSelector(selectStatesByRunId(runId));
  const [busy, setBusy] = useState(false);

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
  }, [dispatch]);

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
      await dispatch(doStep(runId));
    } finally {
      setBusy(false);
    }
  }

  function handleBackwardClick(e: any) {}

  function handleForwardClick(e: any) {}

  const isStarted = states.length > 0;
  const state = states[states.length - 1];

  return (
    <div className="runner">
      {isStarted && <VisitTable vt={state.visit_table} />}
      <div className="runner__actions">
        <button onClick={handleStartClick} disabled={isStarted || busy}>
          Start
        </button>
        <button onClick={handleStepClick} disabled={!isStarted || busy}>
          Step
        </button>
        <button onClick={handleBackwardClick} title="backward" disabled={busy}>
          {"<<"}
        </button>
        <input type="number" value={state.step} />
        <button onClick={handleForwardClick} title="forward" disabled={busy}>
          {">>"}
        </button>
      </div>
    </div>
  );
}
