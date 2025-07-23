import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from './ui/button'

interface Props {
    children?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
    errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo)
        this.setState({
            error,
            errorInfo
        })
    }

    private handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        })
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center min-h-screen bg-background p-4">
                    <div className="max-w-md w-full space-y-4 text-center">
                        <div className="flex justify-center">
                            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                                <AlertCircle className="w-8 h-8 text-destructive" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-semibold">Something went wrong</h1>
                        <p className="text-muted-foreground">
                            An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
                        </p>
                        {this.state.error && (
                            <details className="text-left bg-muted rounded-lg p-4">
                                <summary className="cursor-pointer text-sm font-medium">Error details</summary>
                                <pre className="mt-2 text-xs overflow-x-auto">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo && '\n\nComponent Stack:\n' + this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}
                        <div className="flex gap-2 justify-center">
                            <Button onClick={this.handleReset}>
                                Try again
                            </Button>
                            <Button variant="outline" onClick={() => window.location.reload()}>
                                Refresh page
                            </Button>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
} 