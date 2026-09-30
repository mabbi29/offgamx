import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Smartphone,
  Monitor,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Heart,
  Share2,
} from 'lucide-react';

interface GameControlBarProps {
  isPaused: boolean;
  onTogglePause: () => void;
  onRestart: () => void;
  isSoundOn: boolean;
  onToggleSound: () => void;
  aspectMode: '16:9' | '9:16';
  onChangeAspect: (mode: '16:9' | '9:16') => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onBack: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onShare: () => void;
  title: string;
  category: string;
}

export const GameControlBar: React.FC<GameControlBarProps> = ({
  isPaused,
  onTogglePause,
  onRestart,
  isSoundOn,
  onToggleSound,
  aspectMode,
  onChangeAspect,
  isFullscreen,
  onToggleFullscreen,
  onBack,
  isFavorite,
  onToggleFavorite,
  onShare,
  title,
  category,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-t-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-slate-300">
      {/* Left: Back button & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          title="Back to all games"
          className="flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-sm font-bold text-white tracking-wide truncate max-w-xs">
            {title}
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-xs text-cyan-400 font-medium uppercase tracking-wider">
            {category}
          </span>
        </div>
      </div>

      {/* Right: The 8 Control Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* 1. Pause / Resume */}
        <button
          onClick={onTogglePause}
          title={isPaused ? 'Resume Game' : 'Pause Game'}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isPaused
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
        >
          {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
          <span className="hidden md:inline">{isPaused ? 'Resume' : 'Pause'}</span>
        </button>

        {/* 2. Restart */}
        <button
          onClick={onRestart}
          title="Restart Current Level"
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Restart</span>
        </button>

        {/* 3. Sound Toggle */}
        <button
          onClick={onToggleSound}
          title={isSoundOn ? 'Mute Audio' : 'Unmute Audio'}
          className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
            isSoundOn ? 'bg-slate-800 hover:bg-slate-700 text-cyan-400' : 'bg-rose-950/60 text-rose-300'
          }`}
        >
          {isSoundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span className="hidden md:inline">{isSoundOn ? 'Sound' : 'Muted'}</span>
        </button>

        {/* 4 & 5. Aspect Ratio Controls (16:9 Landscape / 9:16 Portrait) */}
        <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
          <button
            onClick={() => onChangeAspect('16:9')}
            title="Wide 16:9 Mode"
            className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
              aspectMode === '16:9'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3 h-3" />
            <span className="text-[10px]">16:9</span>
          </button>
          <button
            onClick={() => onChangeAspect('9:16')}
            title="Mobile 9:16 Portrait Mode"
            className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
              aspectMode === '9:16'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3 h-3" />
            <span className="text-[10px]">9:16</span>
          </button>
        </div>

        {/* 6. Fullscreen */}
        <button
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          <span className="hidden lg:inline">{isFullscreen ? 'Exit' : 'Full'}</span>
        </button>

        {/* 7. Favorite */}
        <button
          onClick={onToggleFavorite}
          title={isFavorite ? 'Remove Favorite' : 'Save Favorite'}
          className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
            isFavorite ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500' : ''}`} />
        </button>

        {/* 8. Share */}
        <button
          onClick={onShare}
          title="Share Game Link"
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
