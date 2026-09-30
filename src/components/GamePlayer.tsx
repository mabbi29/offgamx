import React, { useState, useEffect, useRef } from 'react';
import { GameMetadata } from '../types';
import { GameControlBar } from './GameControlBar';
import { GameInfo } from './GameInfo';
import { RelatedGames } from './RelatedGames';
import { AdSlot } from './AdSlot';
import { GameEngineRegistry } from '../games/GameEngineRegistry';
import { sound } from '../utils/audio';

interface GamePlayerProps {
  game: GameMetadata;
  allGames: GameMetadata[];
  onSelectGame: (game: GameMetadata) => void;
  onBack: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  favorites: string[];
}

export const GamePlayer: React.FC<GamePlayerProps> = ({
  game,
  allGames,
  onSelectGame,
  onBack,
  isFavorite,
  onToggleFavorite,
  favorites,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Level progression in localStorage
  const [level, setLevel] = useState<number>(1);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(sound.enabled);
  const [aspectMode, setAspectMode] = useState<'16:9' | '9:16'>('16:9');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

  // Load level progress on game change
  useEffect(() => {
    const savedLevel = localStorage.getItem(`offgamx-${game.slug}-level`);
    if (savedLevel) {
      const parsed = parseInt(savedLevel, 10);
      if (!isNaN(parsed) && parsed >= 1) {
        setLevel(parsed);
      }
    } else {
      setLevel(1);
    }
    setIsPaused(false);
  }, [game.slug]);

  const handleNextLevel = () => {
    const nextLvl = Math.min(game.maxLevels, level + 1);
    setLevel(nextLvl);
    localStorage.setItem(`offgamx-${game.slug}-level`, String(nextLvl));
  };

  const handleRestart = () => {
    setIsPaused(false);
  };

  const handleToggleSound = () => {
    const next = sound.toggle();
    setIsSoundOn(next);
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/#game/${game.slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 3000);
      });
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Toast notification for link copy */}
      {copiedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-cyan-500 text-slate-950 font-bold px-4 py-2 rounded-xl shadow-xl border border-cyan-300 text-xs">
          Game link copied to clipboard!
        </div>
      )}

      {/* Main Game Frame Container */}
      <div
        ref={containerRef}
        className={`w-full bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden transition-all duration-300 ${
          isFullscreen ? 'p-0 rounded-none' : ''
        }`}
      >
        {/* Game Control Bar with 8 controls */}
        <GameControlBar
          isPaused={isPaused}
          onTogglePause={() => setIsPaused(!isPaused)}
          onRestart={handleRestart}
          isSoundOn={isSoundOn}
          onToggleSound={handleToggleSound}
          aspectMode={aspectMode}
          onChangeAspect={(m) => setAspectMode(m)}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          onBack={onBack}
          isFavorite={isFavorite}
          onToggleFavorite={() => onToggleFavorite(game.id)}
          onShare={handleShare}
          title={game.title}
          category={game.category}
        />

        {/* Edge-to-Edge Responsive Game Player Frame */}
        <div
          className={`w-full relative bg-slate-950 transition-all ${
            aspectMode === '16:9' ? 'aspect-[16/9]' : 'aspect-[9/16] max-w-md mx-auto'
          } ${isFullscreen ? '!aspect-auto h-[calc(100vh-50px)]' : 'min-h-[460px] max-h-[82vh]'}`}
        >
          <GameEngineRegistry
            slug={game.slug}
            level={level}
            isPaused={isPaused}
            isSoundOn={isSoundOn}
            aspectMode={aspectMode}
            isFullscreen={isFullscreen}
            onNextLevel={handleNextLevel}
            onRestart={handleRestart}
            onGameOver={() => {}}
            onLevelComplete={handleNextLevel}
          />
        </div>
      </div>

      {/* AdSlot (Top leaderboard below game frame) */}
      <div className="my-6">
        <AdSlot slotId={`player-top-${game.slug}`} format="leaderboard" />
      </div>

      {/* Game Info, Description, How to Play & Reviews */}
      <GameInfo game={game} />

      {/* AdSlot (Bottom leaderboard) */}
      <div className="my-6">
        <AdSlot slotId={`player-bot-${game.slug}`} format="leaderboard" />
      </div>

      {/* In-Place Related Games - 6 per row, 2 rows visible */}
      <RelatedGames
        currentGameId={game.id}
        currentCategory={game.category}
        allGames={allGames}
        onSelectGame={onSelectGame}
        favorites={favorites}
        onToggleFavorite={onToggleFavorite}
        count={12}
      />
    </div>
  );
};
