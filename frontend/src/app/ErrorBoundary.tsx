import { Component, type ErrorInfo, type ReactNode } from "react";

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Не удалось открыть страницу", error, info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="startup" role="alert">
          <p>семестр.</p>
          <h1>Не удалось открыть страницу</h1>
          <p>
            Обновите страницу. Если ошибка повторится, попробуйте обновить
            браузер.
          </p>
          <a href={window.location.pathname + "?reload=" + Date.now()}>
            Обновить страницу
          </a>
        </main>
      );
    }
    return this.props.children;
  }
}
