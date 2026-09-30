import React, { useState } from 'react';
import { Search, Heart, Gamepad2, X } from 'lucide-react';
import { ViewType } from '../types';

interface HeaderProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  favoritesCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  favoritesCount,
  searchQuery,
  onSearchChange,
}) => {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 w-full transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Lockup (Left) */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 cursor-pointer select-none group shrink-0"
        >
          {/* Logo: Blue to Cyan gradient X on white rounded square */}
          <div className="w-10 h-10 rounded-xl bg-white shadow-md shadow-cyan-500/10 flex items-center justify-center p-1.5 transition-transform group-hover:scale-105">
            <svg viewBox="0 0 40 40" className="w-full h-full">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <line x1="10" y1="10" x2="30" y2="30" stroke="url(#logoGrad)" strokeWidth="6" strokeLinecap="round" />
              <line x1="30" y1="10" x2="10" y2="30" stroke="url(#logoGrad)" strokeWidth="6" strokeLinecap="round" />
            </svg>
          </div>

          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
              OffGamX
            </span>
            <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase leading-none">
              Wide Gaming Portal
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Center) */}
        <nav className="hidden md:flex flex-1 items-center justify-center gap-8 text-sm font-medium">
          <button
            onClick={() => onNavigate('home')}
            className={`transition-colors whitespace-nowrap cursor-pointer ${
              currentView === 'home'
                ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400 pb-0.5'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onNavigate('all-games')}
            className={`transition-colors whitespace-nowrap cursor-pointer ${
              currentView === 'all-games'
                ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400 pb-0.5'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            All Games
          </button>
          <button
            onClick={() => onNavigate('popular')}
            className={`transition-colors whitespace-nowrap cursor-pointer ${
              currentView === 'popular'
                ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400 pb-0.5'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Popular
          </button>
          <button
            onClick={() => onNavigate('new')}
            className={`transition-colors whitespace-nowrap cursor-pointer ${
              currentView === 'new'
                ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400 pb-0.5'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            New Releases
          </button>
        </nav>

        {/* Zone 3: Search Bar & Favorites (Right) */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Desktop Search input */}
          <div className="relative hidden sm:block w-48 lg:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search 25+ games..."
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                if (currentView !== 'all-games' && currentView !== 'home') {
                  onNavigate('all-games');
                }
              }}
              className="w-full bg-slate-800/90 text-sm text-slate-100 placeholder-slate-400 pl-9 pr-8 py-1.5 rounded-lg border border-slate-700/80 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mobile search toggle */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="sm:hidden p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
            aria-label="Toggle search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Favorites heart count */}
          <button
            onClick={() => onNavigate('all-games')}
            title="Saved Favorites"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 hover:border-slate-600 transition-colors"
          >
            <Heart className={`w-4 h-4 ${favoritesCount > 0 ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
            <span className="text-xs font-bold font-mono tabular-nums">{favoritesCount}</span>
          </button>

          {/* Quick Play CTA */}
          <button
            onClick={() => onNavigate('all-games')}
            className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-medium text-xs shadow-md shadow-cyan-500/20 transition-all active:scale-95"
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Browse All</span>
          </button>
        </div>
      </div>

      {/* Mobile search expanded */}
      {mobileSearchOpen && (
        <div className="sm:hidden px-4 pb-3 pt-1 border-t border-slate-800 bg-slate-900">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder="Search 25+ browser games..."
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                if (currentView !== 'all-games' && currentView !== 'home') {
                  onNavigate('all-games');
                }
              }}
              className="w-full bg-slate-800 text-sm text-slate-100 placeholder-slate-400 pl-9 pr-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>
      )}
    </header>
  );
};
