import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchRuns, selectStatus } from "./runSlice";

export function RefreshRunsButton() {
  const status = useAppSelector(selectStatus);
  const dispatch = useAppDispatch();

  function handleClick() {
    dispatch(fetchRuns());
  }

  return (
    <button onClick={handleClick} disabled={["pending"].includes(status)}>
      Refresh
    </button>
  );
}
