import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { store } from "./app/store";
import { App } from "./app/App";
import { ErrorBoundary } from "./app/ErrorBoundary";
import "@fontsource-variable/manrope";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <BrowserRouter>
          <a className="skip-link" href="#main-content">
            К основному содержимому
          </a>
          <App />
        </BrowserRouter>
      </Provider>
    </ErrorBoundary>
  </StrictMode>,
);
