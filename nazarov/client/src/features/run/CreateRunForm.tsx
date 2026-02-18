import { ChangeEvent, MouseEvent, useEffect, useState } from "react";
import "./CreateRunForm.css";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { createRun } from "./runSlice";
import { selectAllFunctions } from "../function/functionSlice";

const DEFAULT_LOW = -5;
const DEFAULT_UP = 5;

export function CreateRunForm() {
  const dispatch = useAppDispatch();
  const [busy, setBusy] = useState(false);
  const [functionId, setFunctionId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [dimensions, setDimensions] = useState(1);
  const [agents, setAgents] = useState(1);
  const [maxSteps, setMaxSteps] = useState(100);
  const [low, setLow] = useState<number[]>([DEFAULT_LOW]);
  const [up, setUp] = useState<number[]>([DEFAULT_UP]);
  const functions = useAppSelector(selectAllFunctions);

  useEffect(() => {
    if (functions.length > 0) {
      setFunctionId(functions[0].id);
    }
  }, [functions]);

  async function handleSubmit(e: MouseEvent<HTMLButtonElement>) {
    if (functionId === null) {
      return;
    }
    try {
      setBusy(true);
      await dispatch(
        createRun({
          function_id: functionId,
          name,
          n_agents: agents,
          n_dims: dimensions,
          max_steps: maxSteps,
          low: low,
          up: up,
        }),
      );
    } finally {
      setBusy(false);
    }
  }

  function changeDimensions(e: ChangeEvent<HTMLInputElement>) {
    const d = +e.target.value;
    if (d < 1) {
      return;
    }
    setDimensions(d);
    if (low.length < d) {
      setLow(
        [...Array(d)].map((_, i) => (i < low.length ? low[i] : DEFAULT_LOW)),
      );
      setUp([...Array(d)].map((_, i) => (i < up.length ? up[i] : DEFAULT_UP)));
    } else {
      setLow(low.slice(0, d));
      setUp(up.slice(0, d));
    }
  }

  function changeDimLow(e: ChangeEvent<HTMLInputElement>, idx: number) {
    const v = +e.target.value;
    if (v > up[idx]) {
      return;
    }
    setLow(low.map((x, i) => (i === idx ? v : x)));
  }

  function changeDimUp(e: ChangeEvent<HTMLInputElement>, idx: number) {
    const v = +e.target.value;
    if (v < low[idx]) {
      return;
    }
    setUp(up.map((x, i) => (i === idx ? v : x)));
  }

  function changeAgents(e: ChangeEvent<HTMLInputElement>) {
    const v = +e.target.value;
    if (v < 1) {
      return;
    }
    setAgents(v);
  }

  function changeMaxSteps(e: ChangeEvent<HTMLInputElement>) {
    const v = +e.target.value;
    if (v < 1) {
      return;
    }
    setMaxSteps(v);
  }

  return (
    <form
      className={"create-run-form" + (busy ? " create-run-form__pending" : "")}
    >
      <p>Create a new run.</p>
      <hr />
      <div className="create-run-form__form">
        <p>Name:</p>
        <input
          type="text"
          placeholder="untitled"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <p>Number of agents:</p>
        <input
          type="number"
          placeholder="agents"
          value={agents}
          onChange={changeAgents}
        />
        <p>Max steps:</p>
        <input
          type="number"
          placeholder="max steps"
          value={maxSteps}
          onChange={changeMaxSteps}
        />
        <p>Function:</p>
        {functionId && (
          <select
            value={functionId}
            onChange={(e) => setFunctionId(e.target.value)}
          >
            {functions.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        )}
        <p>Number of dimentions:</p>
        <input
          type="number"
          placeholder="dimensions"
          value={dimensions}
          onChange={changeDimensions}
        />
        <p>Limits for dimensions:</p>
        {[...Array(dimensions)].map((_, idx) => (
          <div key={idx} className="create-run-form__dim">
            <p>d{idx + 1}</p>
            <input
              type="number"
              placeholder={`a${idx + 1} min`}
              value={low[idx]}
              onChange={(e) => changeDimLow(e, idx)}
            />
            <p>to</p>
            <input
              type="number"
              placeholder={`a${idx + 1} max`}
              value={up[idx]}
              onChange={(e) => changeDimUp(e, idx)}
            />
          </div>
        ))}
      </div>
      <hr />
      <button type="submit" onClick={handleSubmit} disabled={busy}>
        Create
      </button>
    </form>
  );
}
