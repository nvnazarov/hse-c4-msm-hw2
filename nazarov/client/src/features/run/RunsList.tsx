import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchRuns, selectAllRuns } from "./runSlice";
import "./RunsList.css";
import { Link } from "react-router-dom";
import { DeleteRunButton } from "./DeleteRunButton";

export function RunsList() {
  const dispatch = useAppDispatch();
  const runs = useAppSelector(selectAllRuns);

  useEffect(() => {
    dispatch(fetchRuns());
  }, [dispatch]);

  return (
    <div className="runs-list">
      <table>
        <caption>Runs</caption>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
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
              <td>{run.created_at}</td>
              <td>
                <DeleteRunButton id={run.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
