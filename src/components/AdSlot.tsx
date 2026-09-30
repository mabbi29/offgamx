import React from 'react';

interface AdSlotProps {
  slotId: string;
  format?: 'leaderboard' | 'in-feed' | 'banner';
  className?: string;
}

export const AdSlot: React.FC<AdSlotProps> = ({
  slotId,
  format = 'leaderboard',
  className = '',
}) => {
  const isLeaderboard = format === 'leaderboard';

  return (
    <div
      className={`w-full mx-auto my-6 border border-dashed border-slate-700/60 rounded-xl bg-slate-900/40 p-4 text-center select-none overflow-hidden transition-all ${
        isLeaderboard ? 'min-h-[80px]' : 'min-h-[90px]'
      } ${className}`}
      aria-label="Advertisement Slot"
    >
      <div className="flex flex-col items-center justify-center h-full text-slate-500 py-1">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
          Advertisement — Reserved Ad Space
        </span>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-mono text-cyan-500/70">
            Google AdSense Slot — ID: {slotId}
          </span>
          <span className="text-slate-600 text-xs">·</span>
          <span className="text-xs text-slate-400">
            Targeted Non-Intrusive Display Unit
          </span>
        </div>
      </div>
    </div>
  );
};
