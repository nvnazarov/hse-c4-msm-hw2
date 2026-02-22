import { State } from "./stateSlice";
import "./FoodSourcesTable.css";

export interface Props {
  state: State;
}

export function FoodSourcesTable({ state }: Props) {
  return (
    <div className="food-sources-table">
      <p>Food Sources</p>
      <hr />
      <table>
        <thead>
          <tr>
            <td></td>
            {state.agents[0]!.map((_, idx) => (
              <td key={idx}>
                <b>d{idx + 1}</b>
              </td>
            ))}
            <td title="Fitness Value"><b>F</b></td>
          </tr>
        </thead>
        <tbody>
          {state.agents.map((agent, idx) => (
            <tr key={idx}>
              <td>
                <b>x{idx + 1}</b>
              </td>
              {agent.map((dim, dimIdx) => (
                <td key={dimIdx} title={dim.toString()}>
                  {dim.toFixed(2)}
                </td>
              ))}
              <td title={state.fitness[idx]!.toString()}>{state.fitness[idx]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
