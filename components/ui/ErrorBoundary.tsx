import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** 显示在错误页面的标题 */
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * 错误边界：捕获子组件渲染崩溃，显示友好错误信息而非白屏。
 * 用于推荐页等复杂页面，方便定位线上问题。
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container-page max-w-xl py-20 text-center">
          <div className="mb-3 font-mono text-xs tracking-widest text-red-500">⚠️ ERROR</div>
          <h1 className="text-2xl font-semibold text-ink">
            {this.props.fallbackTitle || "页面加载出错了"}
          </h1>
          <p className="mt-3 text-sm text-muted">
            这个页面遇到了意外错误，请尝试刷新页面。
          </p>
          {this.state.error && (
            <pre className="mx-auto mt-4 max-w-lg overflow-auto rounded-card border border-red-200 bg-red-50 p-4 text-left text-xs text-red-700">
              {this.state.error.message}
              {"\n\n"}
              {this.state.error.stack?.substring(0, 800)}
            </pre>
          )}
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="rounded-card bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
            >
              重试
            </button>
            <a
              href="/"
              className="rounded-card border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-panel"
            >
              回首页
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
