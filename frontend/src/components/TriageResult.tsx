import React from 'react';
import { 
  AlertTriangle, 
  Flame, 
  Layers, 
  Users, 
  CheckCircle, 
  Clock, 
  HelpCircle,
  FileText
} from 'lucide-react';
import type { TriageResultData, SeverityLevel } from '../types/triage';

interface TriageResultProps {
  result: TriageResultData | null;
}

export const TriageResult: React.FC<TriageResultProps> = ({ result }) => {
  if (!result) return null;

  const getSeverityBadge = (sev: SeverityLevel) => {
    switch (sev) {
      case 'P0':
        return {
          label: 'P0 - Khẩn cấp (Critical)',
          bg: 'bg-red-500/10 text-red-400 border-red-500/30',
          icon: <Flame className="w-4 h-4 text-red-400" />,
        };
      case 'P1':
        return {
          label: 'P1 - Cao (High)',
          bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
          icon: <AlertTriangle className="w-4 h-4 text-orange-400" />,
        };
      case 'P2':
        return {
          label: 'P2 - Trung bình (Medium)',
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
        };
      case 'P3':
        return {
          label: 'P3 - Thấp (Low)',
          bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          icon: <Clock className="w-4 h-4 text-blue-400" />,
        };
      default:
        return {
          label: 'Chưa xác định',
          bg: 'bg-slate-800 text-slate-400 border-slate-700',
          icon: <HelpCircle className="w-4 h-4 text-slate-400" />,
        };
    }
  };

  const severityInfo = getSeverityBadge(result.severity);

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl space-y-5 animate-in fade-in duration-300">
      {/* Top Status & Severity Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Severity Badge */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${severityInfo.bg}`}>
            {severityInfo.icon}
            <span>{severityInfo.label}</span>
          </span>

          {/* Urgent Tag */}
          {result.needs_urgent_response && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-600/90 text-white shadow-sm shadow-red-950">
              <Flame className="w-3.5 h-3.5" />
              <span>Cần phản hồi khẩn cấp</span>
            </span>
          )}
        </div>

        {/* Status */}
        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
          <CheckCircle className="w-3.5 h-3.5" />
          <span className="capitalize">{result.status === 'classified' ? 'Đã phân loại' : result.status}</span>
        </span>
      </div>

      {/* Component & Owner Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 mt-0.5">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Thành phần (Component)</div>
            <div className="text-sm font-semibold text-slate-100 font-mono mt-0.5">
              {result.component || 'Không xác định'}
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Đội ngũ phụ trách (Owner)</div>
            <div className="text-sm font-semibold text-emerald-300 font-mono mt-0.5">
              {result.owner_team || 'Chưa gán'}
            </div>
          </div>
        </div>
      </div>

      {/* Reason */}
      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 text-sm leading-relaxed text-slate-300">
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <span>Lý do phân loại</span>
        </div>
        <p className="whitespace-pre-wrap">{result.reason}</p>
      </div>
    </div>
  );
};
