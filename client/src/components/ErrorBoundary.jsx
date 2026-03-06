import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  // ✅ ONLY error available here
  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error: error,
    };
  }

  // ✅ errorInfo available HERE
  componentDidCatch(error, errorInfo) {
    this.setState({
      errorInfo: errorInfo,
    });

    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "20px",
            border: "2px solid #ff6b6b",
            borderRadius: "8px",
            backgroundColor: "#fee",
            color: "#721c24",
            textAlign: "center",
            maxWidth: "500px",
            margin: "50px auto",
          }}
        >
          <h2>Something went wrong</h2>

          <details
            style={{
              whiteSpace: "pre-wrap",
              fontSize: "14px",
            }}
          >
            {this.state.error?.toString()}
            <br />
            {this.state.errorInfo?.componentStack}
          </details>

          <p style={{ marginTop: "10px" }}>
            Please refresh the page and try again.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;