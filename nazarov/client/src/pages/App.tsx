import { useParams } from "react-router-dom";
import { CreateRunForm, RunsList } from "../features/run";
import { Runner } from "../features/state";
import "./App.css";

export function App() {
  const { runId } = useParams();
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
