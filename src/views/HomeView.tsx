import React from 'react';
import { GameMetadata } from '../types';
import { HeroSection } from '../components/HeroSection';
import { GameCard } from '../components/GameCard';
import { AdSlot } from '../components/AdSlot';
import { Flame, Sparkles } from 'lucide-react';

interface HomeViewProps {
  games: GameMetadata[];
  onSelectGame: (game: GameMetadata) => void;
  onBrowseAll: () => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  games,
  onSelectGame,
  onBrowseAll,
  favorites,
  onToggleFavorite,
}) => {
  const featuredGame = games.find((g) => g.slug === 'neon-rush-2') || games[0];
  const hotGames = games.filter((g) => g.badge === 'HOT' || g.badge === 'TOP RATED');
  // Ensure at least 12 featured games are visible above the fold
  const trendingGames = [
    ...hotGames,
    ...games.filter((g) => !hotGames.some((h) => h.id === g.id)),
  ].slice(0, 12);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Hero Section */}
      <HeroSection
        totalGames={games.length}
        onPlayFeatured={(g) => onSelectGame(g || featuredGame)}
        onBrowseAll={onBrowseAll}
        featuredGame={featuredGame}
      />

      {/* Top AdSlot */}
      <div className="my-8">
        <AdSlot slotId="home-top-leaderboard" format="leaderboard" />
      </div>

      {/* Featured Hot Games Section */}
      <div className="mt-10 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Flame className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Trending & Featured Games
          </h2>
        </div>
        <button
          onClick={onBrowseAll}
          className="text-xs sm:text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
        >
          View All ({games.length}) →
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
        {trendingGames.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onSelect={onSelectGame}
            isFavorite={favorites.includes(game.id)}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>

      {/* Mid AdSlot */}
      <div className="my-10">
        <AdSlot slotId="home-mid-banner" format="in-feed" />
      </div>

      {/* All Available Titles Grid */}
      <div className="mt-10 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            All Browser Games in Wide Mode
          </h2>
        </div>
        <span className="text-xs font-mono text-slate-400">
          {games.length} Games Available
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
        {games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onSelect={onSelectGame}
            isFavorite={favorites.includes(game.id)}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>

      {/* Bottom AdSlot */}
      <div className="my-10">
        <AdSlot slotId="home-bottom-leaderboard" format="leaderboard" />
      </div>

      {/* Game count badge */}
      <div className="text-center py-6">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{games.length} Games Available · Instant Play · Edge-to-Edge Wide Mode</span>
        </div>
      </div>
    </div>
  );
};
