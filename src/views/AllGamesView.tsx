import React, { useState, useMemo } from 'react';
import { GameMetadata, GameCategory } from '../types';
import { GameCard } from '../components/GameCard';
import { AdSlot } from '../components/AdSlot';
import { Filter, ArrowUpDown } from 'lucide-react';

interface AllGamesViewProps {
  games: GameMetadata[];
  onSelectGame: (game: GameMetadata) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  searchQuery: string;
}

export const AllGamesView: React.FC<AllGamesViewProps> = ({
  games,
  onSelectGame,
  favorites,
  onToggleFavorite,
  searchQuery,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'newest'>('popular');

  const categories: string[] = [
    'All',
    'Racing',
    'Arcade',
    'Shooting',
    'Platformer',
    'Tower Defense',
    'Puzzle',
    'Action',
    'Fighting',
    'Sports',
    'Simulation',
    'Exploration',
    'Hypercasual',
    'Survival',
    'Roguelike',
    'Card',
    'Board',
    'Logic',
    'Mahjong',
    'Solitaire',
  ];

  const filteredGames = useMemo(() => {
    return games
      .filter((g) => {
        const matchesCategory =
          selectedCategory === 'All' || g.category === selectedCategory;
        const matchesSearch =
          !searchQuery.trim() ||
          g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
          g.category.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'popular') return b.playsCount - a.playsCount;
        if (sortBy === 'rating') return b.rating - a.rating;
        return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
      });
  }, [games, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Title & Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            All Browser Games
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse our complete library of 25+ browser games built for wide mode play.
          </p>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'popular' | 'rating' | 'newest')}
            className="bg-transparent text-xs text-cyan-400 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="popular" className="bg-slate-900 text-white">Most Popular</option>
            <option value="rating" className="bg-slate-900 text-white">Highest Rated</option>
            <option value="newest" className="bg-slate-900 text-white">Newest First</option>
          </select>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="my-6 overflow-x-auto pb-2 scrollbar-none">
        <div className="flex items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Top AdSlot */}
      <div className="my-6">
        <AdSlot slotId="all-games-top-leaderboard" format="leaderboard" />
      </div>

      {/* Results Count & Grid */}
      <div className="mb-4 text-xs font-mono text-slate-400">
        Showing {filteredGames.length} of {games.length} games
        {selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}
        {searchQuery ? ` matching "${searchQuery}"` : ''}
      </div>

      {filteredGames.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/50 rounded-3xl border border-slate-800">
          <p className="text-base text-slate-300 font-bold">No games found</p>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your category or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
          {filteredGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onSelect={onSelectGame}
              isFavorite={favorites.includes(game.id)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}

      {/* Bottom AdSlot */}
      <div className="my-8">
        <AdSlot slotId="all-games-bottom-leaderboard" format="leaderboard" />
      </div>
    </div>
  );
};
