import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';

interface DashboardErrorBoundaryProps {
  children: ReactNode;
  onLoadDemo: () => void;
  onReturnToImport: () => void;
}

interface DashboardErrorBoundaryState {
  error: Error | null;
}

export class DashboardErrorBoundary extends Component<
  DashboardErrorBoundaryProps,
  DashboardErrorBoundaryState
> {
  state: DashboardErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): DashboardErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Signal dashboard failed to render', error, info);
  }

  private recover(action: () => void) {
    action();
    this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="min-h-screen bg-signal-bg flex items-center justify-center px-6">
        <section
          className="card w-full max-w-lg p-6 text-center"
          role="alert"
          aria-labelledby="dashboard-error-title"
        >
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-signal-danger/10 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-signal-danger" aria-hidden="true" />
          </div>
          <h1 id="dashboard-error-title" className="text-xl font-semibold text-signal-fg">
            This dataset could not be displayed
          </h1>
          <p className="mt-2 text-sm text-signal-fgMuted">
            Your current data was not deleted. You can choose another file or recover with the demo dataset.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="secondary" onClick={() => this.recover(this.props.onReturnToImport)}>
              Choose another file
            </Button>
            <Button onClick={() => this.recover(this.props.onLoadDemo)}>
              Load demo dataset
            </Button>
          </div>
        </section>
      </main>
    );
  }
}
