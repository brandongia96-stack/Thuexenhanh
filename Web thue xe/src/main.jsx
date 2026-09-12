import React, { Component } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="fatal-error">
          <h1>Ứng dụng đang gặp lỗi khi tải</h1>
          <p>{this.state.error.message}</p>
          <button onClick={() => {
            localStorage.removeItem("web-thue-xe-cars");
            window.location.reload();
          }}>
            Xóa dữ liệu tạm và tải lại
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
