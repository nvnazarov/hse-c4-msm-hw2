import "./RunsList.css";
import { Link } from "react-router-dom";
import { DeleteRunButton } from "./DeleteRunButton";
import moment from "moment";
import { useAppSelector } from "../../app/hooks";
import { selectAllRuns, selectStatus } from "./runSlice";
import { selectAllFunctions } from "../function/functionSlice";
import { RefreshRunsButton } from "./RefreshRunsButton";

export function RunsList() {
  const runs = useAppSelector(selectAllRuns);
  const functions = useAppSelector(selectAllFunctions);
  const status = useAppSelector(selectStatus);

  return (
    <div
      className={
        "runs-list" + (status === "pending" ? " runs-list__pending" : "")
      }
    >
      <p>
        This is the list of all your runs. You can <RefreshRunsButton /> the
        list.
      </p>
      <hr />
      <div className="runs-list__table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Function</th>
              <th title="Number of agents">N</th>
              <th title="Number of dimentions">D</th>
              <th>Created at</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr key={run.id}>
                <td title={run.id}>
                  <Link to={`/runs/${run.id}`}>{run.id.substring(0, 8)}</Link>
                </td>
                <td>{run.name}</td>
                <td>{functions.find((f) => f.id === run.function_id)?.name}</td>
                <td>{run.n_agents}</td>
                <td>{run.n_dims}</td>
                <td>{moment(run.created_at).format("DD.MM.YYYY hh:mm:ss")}</td>
                <td>
                  <DeleteRunButton id={run.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
