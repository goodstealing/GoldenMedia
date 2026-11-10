import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallbackTitle?: string;
};

type State = {
  hasError: boolean;
  errorMessage: string | null;
};

export class ReaderErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    errorMessage: null
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || "Неизвестная ошибка"
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ReaderErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="reader-fallback">
        <h3>{this.props.fallbackTitle ?? "Ошибка ридера"}</h3>
        <p>{this.state.errorMessage ?? "Не удалось отобразить содержимое книги."}</p>
        <button type="button" className="btn btn-secondary" onClick={this.handleReset}>
          Попробовать снова
        </button>
      </div>
    );
  }
}
