import React from 'react';
import { GameMetadata } from '../types';
import { GameCard } from '../components/GameCard';
import { AdSlot } from '../components/AdSlot';
import { Flame, Star } from 'lucide-react';

interface PopularViewProps {
  games: GameMetadata[];
  onSelectGame: (game: GameMetadata) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}

export const PopularView: React.FC<PopularViewProps> = ({
  games,
  onSelectGame,
  favorites,
  onToggleFavorite,
}) => {
  const popularGames = [...games].sort((a, b) => b.playsCount - a.playsCount);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center gap-3 pb-6 border-b border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <Flame className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Popular Games
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            The most played and highest rated browser games on OffGamX.
          </p>
        </div>
      </div>

      <div className="my-6">
        <AdSlot slotId="popular-top-leaderboard" format="leaderboard" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 my-6">
        {popularGames.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onSelect={onSelectGame}
            isFavorite={favorites.includes(game.id)}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>

      <div className="my-8">
        <AdSlot slotId="popular-bottom-leaderboard" format="leaderboard" />
      </div>
    </div>
  );
};
