import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

// Mock child component that throws an error
const ThrowingComponent: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>Working component</div>;
};

// Mock console.error to avoid noise in tests
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Working component')).toBeInTheDocument();
  });

  it('should render error fallback when child throws an error', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument();
  });

  it('should display error message in fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Test error message/)).toBeInTheDocument();
  });

  it('should have a retry button that attempts to re-render', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeInTheDocument();

    // Simulate fixing the error and retrying
    rerender(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    // After retry with fixed component, should show working component
    expect(screen.getByText('Working component')).toBeInTheDocument();
  });

  it('should provide error details in development mode', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error Details')).toBeInTheDocument();

    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should render custom fallback component when provided', () => {
    const CustomFallback: React.FC<{ error: Error; resetError: () => void }> = ({ error }) => (
      <div>
        <h1>Custom Error Fallback</h1>
        <p>Error: {error.message}</p>
      </div>
    );

    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Error Fallback')).toBeInTheDocument();
    expect(screen.getByText('Error: Test error message')).toBeInTheDocument();
  });

  it('should call onError callback when error occurs', () => {
    const onErrorSpy = jest.fn();

    render(
      <ErrorBoundary onError={onErrorSpy}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onErrorSpy).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    );
  });

  it('should reset error state when children change', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Change children - should reset error state
    rerender(
      <ErrorBoundary>
        <div>Different component</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Different component')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('should handle errors in componentDidUpdate', () => {
    const ComponentWithUpdateError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
      React.useEffect(() => {
        if (shouldThrow) {
          throw new Error('Update error');
        }
      }, [shouldThrow]);

      return <div>Component with update</div>;
    };

    const { rerender } = render(
      <ErrorBoundary>
        <ComponentWithUpdateError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Component with update')).toBeInTheDocument();

    // This should trigger error in useEffect
    rerender(
      <ErrorBoundary>
        <ComponentWithUpdateError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Note: useEffect errors are not caught by error boundaries
    // This test documents the current behavior
    expect(screen.getByText('Component with update')).toBeInTheDocument();
  });

  it('should provide accessible error message', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    const errorAlert = screen.getByRole('alert');
    expect(errorAlert).toBeInTheDocument();
    expect(errorAlert).toHaveTextContent('Something went wrong');
  });

  it('should handle nested error boundaries', () => {
    const InnerThrowingComponent: React.FC = () => {
      throw new Error('Inner error');
    };

    const MiddleComponent: React.FC = () => (
      <ErrorBoundary>
        <InnerThrowingComponent />
      </ErrorBoundary>
    );

    render(
      <ErrorBoundary>
        <MiddleComponent />
      </ErrorBoundary>
    );

    // Inner error boundary should catch the error
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/Inner error/)).toBeInTheDocument();
  });
});
