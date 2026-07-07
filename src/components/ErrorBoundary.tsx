import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error inside ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text-bright p-6 text-center select-none animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-red-950/20 border border-red-900/30 flex items-center justify-center text-red-400 mb-6">
            <AlertTriangle className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-text-bright">Something went wrong</h1>
          <p className="text-sm text-text-secondary mt-2 max-w-md mx-auto leading-relaxed">
            An unexpected application error occurred. We have logged this error and you can retry the operation or return to the main dashboard.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Button onClick={this.handleRetry} className="flex items-center gap-2 font-semibold bg-emerald-600 hover:bg-emerald-500 text-white">
              <RotateCcw className="w-4 h-4 animate-spin-slow" /> Retry Action
            </Button>
            <Button onClick={this.handleReset} variant="outline" className="flex items-center gap-2">
              <Home className="w-4 h-4" /> Return Home
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()} className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" /> Reload Session
            </Button>
          </div>
          {this.state.error && (
            <details className="mt-8 w-full max-w-lg mx-auto text-left border border-slate-900 bg-card/45 backdrop-blur-md rounded-xl p-4">
              <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-wider text-text-secondary select-none hover:text-text-bright transition-colors outline-none">
                Debug Details
              </summary>
              <div className="mt-4 p-3 rounded-lg bg-background/50 text-[10px] font-mono text-text-secondary overflow-auto max-h-[180px] leading-relaxed">
                <p className="font-bold text-red-400 mb-2">{this.state.error.toString()}</p>
                {this.state.error.stack && (
                  <pre className="whitespace-pre overflow-x-auto text-[9px] text-slate-500">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
