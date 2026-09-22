import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Wrench, 
  Terminal, 
  ArrowLeftRight, 
  CheckCircle2, 
  Code2,
  Loader2
} from 'lucide-react';
import type { TraceStageItem } from '../types/triage';

interface ExecutionTraceViewerProps {
  traces: TraceStageItem[];
  isLoading: boolean;
}

export const ExecutionTraceViewer: React.FC<ExecutionTraceViewerProps> = ({ traces, isLoading }) => {
  const [openPayloads, setOpenPayloads] = useState<Record<number, boolean>>({});
  const [isSectionOpen, setIsSectionOpen] = useState<boolean>(true);

  const togglePayload = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenPayloads((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  if (!isLoading && traces.length === 0) {
    return null;
  }

  const getStepIcon = (stage: string, stepNum: number) => {
    const s = stage?.toLowerCase() || '';
    if (s.includes('tool_call') || stepNum === 1) {
      return <Wrench className="w-3.5 h-3.5 text-amber-400" />;
    }
    if (s.includes('application') || s.includes('executes') || stepNum === 2) {
      return <Terminal className="w-3.5 h-3.5 text-blue-400" />;
    }
    if (s.includes('tool_result') || s.includes('result') || stepNum === 3) {
      return <ArrowLeftRight className="w-3.5 h-3.5 text-purple-400" />;
    }
    return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
  };

  return (
    <div className="bg-slate-900/50 rounded-2xl border border-slate-800/80 overflow-hidden shadow-lg transition-all">
      {/* Header bar that toggles section */}
      <div 
        onClick={() => setIsSectionOpen(!isSectionOpen)}
        className="px-5 py-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-850/50 transition-colors select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-emerald-400 font-mono text-xs font-bold">
            &gt;_
          </div>
          <h3 className="text-sm font-semibold text-slate-200">
            Vết thực thi 4 chặng (Function Calling Trace)
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            {traces.length}/4 bước
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          {isLoading && (
            <span className="flex items-center gap-1 text-amber-400 font-mono animate-pulse mr-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Đang thực thi...
            </span>
          )}
          <span>{isSectionOpen ? 'Thu gọn' : 'Mở rộng'}</span>
          {isSectionOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
      </div>

      {/* Trace Items */}
      {isSectionOpen && (
        <div className="px-5 pb-5 pt-1 space-y-3 border-t border-slate-800/60">
          {isLoading && traces.length === 0 && (
            <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2 font-mono">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Đang kết nối LLM và khởi chạy quy trình phân loại...</span>
            </div>
          )}

          {traces.map((trace, idx) => {
            const hasPayloadOpen = Boolean(openPayloads[idx]);
            const stepNumber = trace.step || idx + 1;

            return (
              <div 
                key={idx}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-all text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center flex-shrink-0">
                      {getStepIcon(trace.stage, stepNumber)}
                    </div>
                    <span className="font-mono text-slate-400 font-bold">
                      Bước {stepNumber}:
                    </span>
                    <span className="text-slate-200 font-medium truncate">
                      {trace.subtitle || trace.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 font-mono">
                    <span className="text-[11px] text-slate-500">{trace.timestamp}</span>
                    <button
                      type="button"
                      onClick={(e) => togglePayload(idx, e)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-750 text-slate-300 text-[11px] transition-colors border border-slate-700/50"
                    >
                      <Code2 className="w-3 h-3 text-cyan-400" />
                      <span>{hasPayloadOpen ? 'Đóng JSON' : 'Xem JSON'}</span>
                    </button>
                  </div>
                </div>

                {/* Collapsible JSON Preview */}
                {hasPayloadOpen && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 font-mono">
                    <pre className="p-2.5 rounded-lg bg-black/50 border border-slate-800 text-emerald-400 text-[11px] overflow-x-auto max-h-[220px]">
                      {typeof trace.payload === 'string'
                        ? trace.payload
                        : JSON.stringify(trace.payload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
