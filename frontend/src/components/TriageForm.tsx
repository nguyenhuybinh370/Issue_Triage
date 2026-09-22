import React from 'react';
import { Loader2, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

interface TriageFormProps {
  issueText: string;
  setIssueText: (text: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  errorMessage: string | null;
  onClearError: () => void;
}

const SAMPLE_1 = 'Nút thanh toán trả HTTP 500 với mọi thẻ Visa từ 14:30.';
const SAMPLE_2 = 'API đăng nhập trả HTTP 503 cho toàn bộ người dùng từ 09:15.';

export const TriageForm: React.FC<TriageFormProps> = ({
  issueText,
  setIssueText,
  onSubmit,
  isLoading,
  errorMessage,
  onClearError,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueText.trim() || isLoading) return;
    onSubmit();
  };

  const handleSelectSample = (sample: string) => {
    setIssueText(sample);
    if (errorMessage) onClearError();
  };

  return (
    <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-5 shadow-lg backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="flex items-center justify-between">
          <label htmlFor="issue-textarea" className="text-sm font-medium text-slate-200 flex items-center gap-2">
            <span>Mô tả sự cố</span>
            <span className="text-xs text-slate-500 font-normal">(hệ thống, lỗi HTTP, thời gian...)</span>
          </label>
          <span className="text-xs text-slate-500 font-mono">
            {issueText.length > 0 ? `${issueText.length} ký tự` : ''}
          </span>
        </div>

        <textarea
          id="issue-textarea"
          rows={3}
          value={issueText}
          onChange={(e) => {
            setIssueText(e.target.value);
            if (errorMessage) onClearError();
          }}
          placeholder="Nhập nội dung sự cố cần phân loại (ví dụ: Service bị lỗi 500, thanh toán gián đoạn...)..."
          disabled={isLoading}
          className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all font-sans resize-none disabled:opacity-50"
        />

        {/* Action Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Quick Samples */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Mẫu:</span>
            <button
              type="button"
              onClick={() => handleSelectSample(SAMPLE_1)}
              disabled={isLoading}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700/60 hover:border-slate-600 transition-all"
            >
              💳 Lỗi thanh toán Visa (500)
            </button>
            <button
              type="button"
              onClick={() => handleSelectSample(SAMPLE_2)}
              disabled={isLoading}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700/60 hover:border-slate-600 transition-all"
            >
              🔐 Lỗi đăng nhập API (503)
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !issueText.trim()}
            className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-emerald-950/30"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>Phân loại sự cố</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5 text-emerald-200" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error alert */}
      {errorMessage && (
        <div className="mt-3 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 flex items-start gap-2.5 text-xs">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">
            <strong className="text-red-200">Lỗi: </strong>
            {errorMessage}
          </div>
          <button
            type="button"
            onClick={onClearError}
            className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-slate-800/60"
          >
            Đóng
          </button>
        </div>
      )}
    </div>
  );
};
