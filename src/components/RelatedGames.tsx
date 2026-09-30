import React from 'react';
import { GameMetadata } from '../types';
import { GameCard } from './GameCard';

interface RelatedGamesProps {
  currentGameId: string;
  currentCategory: string;
  allGames: GameMetadata[];
  onSelectGame: (game: GameMetadata) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  count?: number;
}

export const RelatedGames: React.FC<RelatedGamesProps> = ({
  currentGameId,
  currentCategory,
  allGames,
  onSelectGame,
  favorites,
  onToggleFavorite,
  count = 12,
}) => {
  // First pick same category games, then other popular titles
  const sameCategory = allGames.filter(
    (g) => g.id !== currentGameId && g.category === currentCategory
  );
  const otherGames = allGames.filter(
    (g) => g.id !== currentGameId && g.category !== currentCategory
  );

  const related = [...sameCategory, ...otherGames].slice(0, count);

  if (related.length === 0) return null;

  return (
    <div className="mt-8 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            More Games Like This
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Instant play in wide mode. Click any game to launch immediately.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {related.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onSelect={(selected) => {
              onSelectGame(selected);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            isFavorite={favorites.includes(game.id)}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </div>
  );
};
