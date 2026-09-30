import React, { useState, useEffect } from 'react';
import { GameMetadata, ViewType } from './types';
import { GAMES } from './data/games';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeView } from './views/HomeView';
import { AllGamesView } from './views/AllGamesView';
import { PopularView } from './views/PopularView';
import { NewView } from './views/NewView';
import { GamePlayer } from './components/GamePlayer';
import {
  AboutView,
  ContactView,
  PrivacyView,
  TermsView,
  DmcaView,
} from './views/StaticViews';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [activeGame, setActiveGame] = useState<GameMetadata | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('offgamx-favorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch {
        setFavorites([]);
      }
    }
  }, []);

  const toggleFavorite = (id: string) => {
    const updated = favorites.includes(id)
      ? favorites.filter((fav) => fav !== id)
      : [...favorites, id];
    setFavorites(updated);
    localStorage.setItem('offgamx-favorites', JSON.stringify(updated));
  };

  // Sync hash routing for shareable URLs
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('/game/')) {
        const slug = hash.replace('/game/', '');
        const found = GAMES.find((g) => g.slug === slug);
        if (found) {
          setActiveGame(found);
          setCurrentView('game');
          return;
        }
      }
      if (['all-games', 'popular', 'new', 'about', 'contact', 'privacy', 'terms', 'dmca'].includes(hash)) {
        setCurrentView(hash as ViewType);
      } else {
        setCurrentView('home');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectGame = (game: GameMetadata) => {
    setActiveGame(game);
    setCurrentView('game');
    window.location.hash = `/game/${game.slug}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (view: ViewType) => {
    setCurrentView(view);
    if (view === 'home') {
      window.location.hash = '';
    } else {
      window.location.hash = view;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top sticky navigation bar */}
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        favoritesCount={favorites.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content View Switcher */}
      <main className="flex-1">
        {currentView === 'game' && activeGame ? (
          <GamePlayer
            game={activeGame}
            allGames={GAMES}
            onSelectGame={handleSelectGame}
            onBack={() => handleNavigate('all-games')}
            isFavorite={favorites.includes(activeGame.id)}
            onToggleFavorite={toggleFavorite}
            favorites={favorites}
          />
        ) : currentView === 'all-games' ? (
          <AllGamesView
            games={GAMES}
            onSelectGame={handleSelectGame}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            searchQuery={searchQuery}
          />
        ) : currentView === 'popular' ? (
          <PopularView
            games={GAMES}
            onSelectGame={handleSelectGame}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
        ) : currentView === 'new' ? (
          <NewView
            games={GAMES}
            onSelectGame={handleSelectGame}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
        ) : currentView === 'about' ? (
          <AboutView />
        ) : currentView === 'contact' ? (
          <ContactView />
        ) : currentView === 'privacy' ? (
          <PrivacyView />
        ) : currentView === 'terms' ? (
          <TermsView />
        ) : currentView === 'dmca' ? (
          <DmcaView />
        ) : (
          <HomeView
            games={GAMES}
            onSelectGame={handleSelectGame}
            onBrowseAll={() => handleNavigate('all-games')}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
        )}
      </main>

      {/* Full width footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
