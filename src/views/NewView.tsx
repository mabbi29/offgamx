import React from 'react';
import { GameMetadata } from '../types';
import { GameCard } from '../components/GameCard';
import { AdSlot } from '../components/AdSlot';
import { Sparkles } from 'lucide-react';

interface NewViewProps {
  games: GameMetadata[];
  onSelectGame: (game: GameMetadata) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}

export const NewView: React.FC<NewViewProps> = ({
  games,
  onSelectGame,
  favorites,
  onToggleFavorite,
}) => {
  const newGames = [...games].sort(
    (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
  );

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center gap-3 pb-6 border-b border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            New Releases
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Fresh browser games engineered and deployed to OffGamX.
          </p>
        </div>
      </div>

      <div className="my-6">
        <AdSlot slotId="new-top-leaderboard" format="leaderboard" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 my-6">
        {newGames.map((game) => (
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
        <AdSlot slotId="new-bottom-leaderboard" format="leaderboard" />
      </div>
    </div>
  );
};
