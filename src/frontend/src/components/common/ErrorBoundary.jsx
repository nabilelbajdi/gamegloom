import React from "react";
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-120px)] px-4">
          <div className="flex flex-col items-center text-center max-w-md">

            {/* Text */}
            <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">
              Something went wrong
            </h1>
            <p className="text-sm text-gray-400 leading-relaxed mb-8">
              An unexpected error crashed this page. Your data is safe —
              try refreshing or head back home.
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-black text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-primary/20"
              >
                Refresh page
              </button>
              <a
                href="/"
                className="px-5 py-2.5 bg-surface-dark hover:bg-surface-hover border border-white/10 hover:border-white/20 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Go home
              </a>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
