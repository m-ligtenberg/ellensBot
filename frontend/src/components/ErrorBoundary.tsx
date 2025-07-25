import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ErrorBoundary caught an error:', error, errorInfo);
    
    // Log error to external service if configured
    if (process.env.REACT_APP_ERROR_REPORTING_ENDPOINT) {
      this.logErrorToService(error, errorInfo);
    }

    this.setState({
      error,
      errorInfo
    });
  }

  private async logErrorToService(error: Error, errorInfo: ErrorInfo) {
    try {
      await fetch(process.env.REACT_APP_ERROR_REPORTING_ENDPOINT!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
          errorInfo,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });
    } catch (logError) {
      console.error('Failed to log error to service:', logError);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-apple-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-card border border-apple-gray-300 p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-4">😵</div>
            <h1 className="text-2xl font-bold text-apple-gray-900 mb-4">
              Oops! Something went wrong
            </h1>
            <p className="text-apple-gray-600 mb-6">
              Young Ellens bot crashed! Don't worry, it's probably not the drugs... 
              or is it? 🤔
            </p>
            
            <div className="space-y-4">
              <button
                onClick={this.handleRetry}
                className="w-full bg-apple-blue hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-xl transition-colors duration-200"
              >
                Try Again
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-apple-gray-200 hover:bg-apple-gray-300 text-apple-gray-700 font-medium py-3 px-6 rounded-xl transition-colors duration-200"
              >
                Reload Page
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-apple-gray-500 text-sm mb-2">
                  Error Details (Development)
                </summary>
                <div className="bg-apple-gray-100 p-4 rounded-lg text-xs font-mono">
                  <div className="text-red-600 font-bold mb-2">
                    {this.state.error.name}: {this.state.error.message}
                  </div>
                  <pre className="whitespace-pre-wrap text-apple-gray-700">
                    {this.state.error.stack}
                  </pre>
                  {this.state.errorInfo && (
                    <div className="mt-4">
                      <div className="text-red-600 font-bold mb-2">Component Stack:</div>
                      <pre className="whitespace-pre-wrap text-apple-gray-700">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;