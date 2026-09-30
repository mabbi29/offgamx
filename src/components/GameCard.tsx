import React from 'react';
import { Play, Heart, Star, Sparkles } from 'lucide-react';
import { GameMetadata } from '../types';

interface GameCardProps {
  game: GameMetadata;
  onSelect: (game: GameMetadata) => void;
  isFavorite: boolean;
  onToggleFavorite: (gameId: string) => void;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  onSelect,
  isFavorite,
  onToggleFavorite,
}) => {
  return (
    <div
      onClick={() => onSelect(game)}
      className="group relative bg-slate-800/80 rounded-2xl border border-slate-700/60 overflow-hidden hover:border-cyan-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 cursor-pointer flex flex-col transform hover:-translate-y-1"
    >
      {/* Thumbnail Aspect 16:9 */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
        {game.thumbnail ? (
          <img
            src={game.thumbnail}
            alt={game.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              // Graceful fallback to styled visual cover
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : null}

        {/* Fallback procedural graphic if image not loaded */}
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-cyan-950 -z-10 flex items-center justify-center p-6 text-center">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              {game.title}
            </span>
            <span className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
              {game.category}
            </span>
          </div>
        </div>

        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

        {/* Badge in top left if present */}
        {game.badge && (
          <div className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider text-white shadow-sm bg-gradient-to-r from-cyan-600 to-blue-600">
            {game.badge}
          </div>
        )}

        {/* Favorite Heart Button in top right */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(game.id);
          }}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-sm transition-transform active:scale-90"
        >
          <Heart
            className={`w-4 h-4 ${
              isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-300 hover:text-white'
            }`}
          />
        </button>

        {/* Play button hover state */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-12 h-12 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/50 transform group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>

        {/* Bottom thumbnail tag */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-xs text-slate-200">
          <span className="font-semibold text-cyan-300 text-[11px] uppercase tracking-wide">
            {game.category}
          </span>
          <div className="flex items-center gap-1 bg-slate-900/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-[11px] font-semibold text-amber-300">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{game.rating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
            {game.title}
          </h3>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {game.tagline}
          </p>
        </div>

        {/* Unboxed Metadata (Zero-Pill discipline) */}
        <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>{game.maxLevels} Levels</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>{game.playsCount.toLocaleString()} plays</span>
          </div>
          <span className="font-semibold text-cyan-400 text-xs flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Play <Play className="w-3 h-3 fill-current" />
          </span>
        </div>
      </div>
    </div>
  );
};
