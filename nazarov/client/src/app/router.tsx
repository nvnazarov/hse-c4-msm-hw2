import { createBrowserRouter } from "react-router-dom";
import { App } from "../pages/App";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/runs/:runId",
    element: <App />,
  },
]);
