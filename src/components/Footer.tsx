import React from 'react';
import { ViewType } from '../types';

interface FooterProps {
  onNavigate: (view: ViewType) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 mt-16 sm:mt-20 w-full transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* 4-column link layout on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
          {/* Column 1: Brand & Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center p-1 shadow-sm">
                <svg viewBox="0 0 40 40" className="w-full h-full">
                  <defs>
                    <linearGradient id="footerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                  <line x1="10" y1="10" x2="30" y2="30" stroke="url(#footerGrad)" strokeWidth="6" strokeLinecap="round" />
                  <line x1="30" y1="10" x2="10" y2="30" stroke="url(#footerGrad)" strokeWidth="6" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-xl font-extrabold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                OffGamX
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              The premier edge-to-edge browser gaming portal. Instant play with zero downloads, zero mandatory video delays, and persistent level progression across all devices.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-800 text-[11px] text-cyan-300 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Edge-to-Edge Gaming</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              Explore Portal
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer text-left"
                >
                  Home Portal
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('all-games')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer text-left"
                >
                  All Games (25+)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('popular')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer text-left"
                >
                  Trending & Popular
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('new')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer text-left"
                >
                  New Releases
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Game Categories */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              Categories
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('all-games')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer text-left"
                >
                  Racing & High Speed
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('all-games')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer text-left"
                >
                  Arcade & Physics Puzzles
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('all-games')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer text-left"
                >
                  Action & Sci-Fi Brawlers
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('all-games')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer text-left"
                >
                  Classic Cards & Logic
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Info */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              Legal & Support
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer text-left"
                >
                  About OffGamX
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('contact')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer text-left"
                >
                  Contact Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('privacy')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('terms')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer text-left"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('dmca')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer text-left"
                >
                  DMCA Notice
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & notice */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <p>© 2026 OffGamX. All rights reserved. Hosted at offgamx.site.</p>
          <p className="text-slate-400">All games are 100% free to play in your browser with zero downloads.</p>
        </div>
      </div>
    </footer>
  );
};
