import React from 'react';
import { Play, Sparkles, Compass, ShieldCheck } from 'lucide-react';
import { GameMetadata } from '../types';

interface HeroSectionProps {
  totalGames: number;
  onPlayFeatured: (game?: GameMetadata) => void;
  onBrowseAll: () => void;
  featuredGame?: GameMetadata;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  totalGames,
  onPlayFeatured,
  onBrowseAll,
  featuredGame,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl my-6">
      {/* Background Graphic & Light accents */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-950/70 via-slate-900/90 to-cyan-950/70 -z-10" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hero content grid - edge-to-edge full width with spacious typography */}
      <div className="relative px-6 py-10 sm:px-10 sm:py-14 lg:px-12 lg:py-16 w-full">
        {/* Quality trust pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>25+ Free Games · Edge-to-Edge Wide Mode · Zero Downloads</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08] max-w-5xl">
          Play the Best Free Browser Games in{' '}
          <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-300 bg-clip-text text-transparent">
            Wide Mode
          </span>
          .
        </h1>

        <p className="mt-4 sm:mt-6 text-base sm:text-lg text-slate-300 max-w-4xl leading-relaxed">
          Instant high-speed 3D racers, brawlers, card classics, physics lab puzzles, and roguelikes. Built from scratch with zero downloads, zero ads inside canvas, and real campaign level saves.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button
            onClick={() => onPlayFeatured(featuredGame)}
            className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Play Instantly</span>
          </button>

          <button
            onClick={onBrowseAll}
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700 font-semibold text-sm transition-all cursor-pointer"
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>Browse {totalGames} Games</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-400 sm:ml-4">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>No installs · 100% Free · Keyboard & Touch Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
