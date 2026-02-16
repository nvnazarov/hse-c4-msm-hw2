import { ChangeEventHandler, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchFunctions, selectAllFunctions } from "./functionSlice";

export interface Props {
  value?: string;
  onChange?: ChangeEventHandler<HTMLSelectElement, HTMLSelectElement>;
}

export function SelectFunction({ value, onChange }: Props) {
  const dispatch = useAppDispatch();
  const functions = useAppSelector(selectAllFunctions);

  useEffect(() => {
    dispatch(fetchFunctions());
  }, [dispatch]);

  return (
    <select value={value} onChange={onChange}>
      {functions.map((f) => (
        <option key={f.id} value={f.id}>
          {f.name}
        </option>
      ))}
    </select>
  );
}
