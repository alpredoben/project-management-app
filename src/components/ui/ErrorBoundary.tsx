import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled UI boundary error:', error, info);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
              Something went wrong
            </h2>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              {this.state.errorMessage || 'An unexpected rendering error occurred.'}
            </p>
            <div className="mt-5">
              <Button
                variant="primary"
                onClick={() => this.setState({ hasError: false, errorMessage: '' })}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reload View
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
