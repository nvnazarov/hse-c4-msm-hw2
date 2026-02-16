import { useState } from "react";
import { useAppDispatch } from "../../app/hooks";
import { deleteRun } from "./runSlice";

export interface Props {
  id: string;
}

export function DeleteRunButton({ id }: Props) {
  const dispatch = useAppDispatch();
  const [busy, setBusy] = useState(false);

  async function handleClick(e: any) {
    try {
      setBusy(true);
      await dispatch(deleteRun(id));
    } finally {
      setBusy(false);
    }
  }

  return <button onClick={handleClick}>Delete</button>;
}
