import { useParams } from "react-router-dom";
import { CreateRunForm, RunsList } from "../features/run";
import { Runner } from "../features/state";
import "./App.css";
import { useEffect } from "react";
import { useAppDispatch } from "../app/hooks";
import { fetchRuns } from "../features/run/runSlice";
import { fetchFunctions } from "../features/function/functionSlice";

export function App() {
  const dispatch = useAppDispatch();
  const { runId } = useParams();

  useEffect(() => {
    dispatch(fetchRuns());
    dispatch(fetchFunctions());
  }, [dispatch]);

  return (
    <div className="app">
      <CreateRunForm />
      <div className="app__main">
        <RunsList />
        {runId && <Runner runId={runId} />}
      </div>
    </div>
  );
}
