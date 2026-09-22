import { useState, useEffect } from 'react';
import { TriageForm } from './components/TriageForm';
import { ExecutionTraceViewer } from './components/ExecutionTraceViewer';
import { TokenUsageCard } from './components/TokenUsageCard';
import { TriageResult } from './components/TriageResult';
import { triageIssue, mockTriageIssue } from './services/api';
import type { ApiError } from './services/api';
import type { TriageResultData, TraceStageItem, TokenUsageMetrics } from './types/triage';
import { Sparkles, ShieldCheck } from 'lucide-react';

export function App() {
  const [issueText, setIssueText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<TriageResultData | null>(null);
  const [traces, setTraces] = useState<TraceStageItem[]>([]);
  const [usage, setUsage] = useState<TokenUsageMetrics | null>(null);
  const [useMock, setUseMock] = useState<boolean>(false);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);

  // Periodic health check to Backend Express at :3001
  useEffect(() => {
    let isMounted = true;

    async function checkBackendHealth() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const res = await fetch('http://localhost:3001/api/triage', {
          method: 'OPTIONS',
          signal: controller.signal,
        }).catch(async () => {
          return await fetch('http://localhost:3001/', { signal: controller.signal });
        });

        clearTimeout(timeoutId);
        if (isMounted) {
          setIsBackendOnline(res.status < 500);
        }
      } catch {
        if (isMounted) {
          setIsBackendOnline(false);
        }
      }
    }

    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleTriageSubmit = async () => {
    if (!issueText.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);
    setResult(null);
    setTraces([]);
    setUsage(null);

    try {
      if (useMock) {
        const responseData = await mockTriageIssue(issueText);
        setResult(responseData.result);
        setTraces(responseData.traces);
        setUsage(responseData.usage);
      } else {
        const responseData = await triageIssue(issueText);
        setResult(responseData.result);
        setTraces(responseData.traces);
        setUsage(responseData.usage);
        setIsBackendOnline(true);
      }
    } catch (err: any) {
      console.error('Triage error:', err);
      const apiErr = err as ApiError;
      if (apiErr.isNetworkError) {
        setIsBackendOnline(false);
        setErrorMessage(
          `${apiErr.message} Gợi ý: Bạn có thể bật "Mock Demo" ở góc trên để chạy thử giao diện ngay lập tức!`
        );
      } else {
        setErrorMessage(apiErr.message || 'Có lỗi xảy ra trong quá trình phân loại sự cố.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Header */}
      <header className="border-b border-slate-850 bg-slate-950/80 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm sm:text-base text-white tracking-tight">Issue Triage</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 font-mono hidden sm:inline">
                AI Incident Classifier
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {/* Backend status indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono">
              <span
                className={`w-2 h-2 rounded-full ${
                  isBackendOnline === true
                    ? 'bg-emerald-500'
                    : isBackendOnline === false
                    ? 'bg-amber-500'
                    : 'bg-slate-500'
                }`}
              />
              <span className="hidden sm:inline">:3001</span>
              <span>{isBackendOnline ? 'Online' : isBackendOnline === false ? 'Offline' : '...'}</span>
            </div>

            {/* Mock toggle button */}
            <button
              type="button"
              onClick={() => setUseMock(!useMock)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                useMock
                  ? 'bg-purple-950/70 border-purple-500/40 text-purple-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>{useMock ? 'Mock Demo' : 'Live API'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* 1. Input Form */}
        <TriageForm
          issueText={issueText}
          setIssueText={setIssueText}
          onSubmit={handleTriageSubmit}
          isLoading={isLoading}
          errorMessage={errorMessage}
          onClearError={() => setErrorMessage(null)}
        />

        {/* 2. Triage Result (Show immediately when ready) */}
        {result && (
          <TriageResult result={result} />
        )}

        {/* 3. Telemetry Bar */}
        {usage && (
          <TokenUsageCard usage={usage} />
        )}

        {/* 4. Execution Trace Viewer */}
        {(traces.length > 0 || isLoading) && (
          <ExecutionTraceViewer traces={traces} isLoading={isLoading} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-3 text-center text-xs text-slate-500">
        <p>Issue Triage Dashboard • Clean & Minimal UI</p>
      </footer>
    </div>
  );
}

export default App;
