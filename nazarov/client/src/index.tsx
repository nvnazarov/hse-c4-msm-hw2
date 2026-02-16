import React from "react";
import ReactDOM from "react-dom/client";

import { router } from "./app/router";
import { store } from "./app/store";
import { Provider } from "react-redux";
import "./index.css";
import { RouterProvider } from "react-router-dom";

const container = document.getElementById("root")!;
const root = ReactDOM.createRoot(container);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>,
);
