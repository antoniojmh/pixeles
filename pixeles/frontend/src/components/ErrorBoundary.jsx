import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            padding: "2rem",
            fontFamily: "monospace",
            color: "#ff6b6b",
            background: "#0a0e17",
            minHeight: "100vh",
          }}
        >
          <h2>⚠️ Error en la app</h2>
          <pre style={{ whiteSpace: "pre-wrap", maxWidth: "100%" }}>
            {String(this.state.error && this.state.error.message)}
            {"\n\n"}
            {String(this.state.error && this.state.error.stack)}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "1rem",
              padding: ".5rem 1rem",
              cursor: "pointer",
              borderRadius: "6px",
              border: "none",
              background: "#3b82f6",
              color: "#fff",
            }}
          >
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
