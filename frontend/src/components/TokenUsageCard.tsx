import React from 'react';
import { Cpu, Clock, Layers } from 'lucide-react';
import type { TokenUsageMetrics } from '../types/triage';

interface TokenUsageCardProps {
  usage: TokenUsageMetrics | null;
}

export const TokenUsageCard: React.FC<TokenUsageCardProps> = ({ usage }) => {
  if (!usage) return null;

  const promptPercent = usage.total_tokens > 0 
    ? Math.round((usage.prompt_tokens / usage.total_tokens) * 100) 
    : 0;

  return (
    <div className="bg-slate-900/40 rounded-xl border border-slate-800/80 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2 text-slate-400 font-medium">
        <Cpu className="w-3.5 h-3.5 text-cyan-400" />
        <span>Tiêu thụ Token & Hiệu năng:</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-4 font-mono text-slate-300">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/60 border border-slate-800">
          <span className="text-slate-500">Prompt:</span>
          <span className="text-sky-300 font-semibold">{usage.prompt_tokens.toLocaleString()}</span>
          <span className="text-[10px] text-slate-500">({promptPercent}%)</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/60 border border-slate-800">
          <span className="text-slate-500">Output:</span>
          <span className="text-emerald-300 font-semibold">{usage.completion_tokens.toLocaleString()}</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/60 border border-slate-800">
          <Layers className="w-3 h-3 text-purple-400" />
          <span className="text-slate-500">Tổng:</span>
          <span className="text-purple-300 font-semibold">{usage.total_tokens.toLocaleString()}</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/60 border border-slate-800">
          <Clock className="w-3 h-3 text-amber-400" />
          <span className="text-amber-300 font-semibold">{(usage.latency_ms / 1000).toFixed(2)}s</span>
        </div>
      </div>
    </div>
  );
};
