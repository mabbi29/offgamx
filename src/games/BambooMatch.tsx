import React, { useState, useEffect } from 'react';
import { ActiveGameContext } from '../types';
import { sound } from '../utils/audio';

interface MahjongTile {
  id: number;
  type: string; // e.g., 'bamboo-1', 'char-3', 'dragon-green'
  symbol: string;
  color: string;
  x: number;
  y: number;
  layer: number;
  removed: boolean;
}

export const BambooMatch: React.FC<ActiveGameContext> = ({
  level,
  onNextLevel,
  onRestart,
}) => {
  const [tiles, setTiles] = useState<MahjongTile[]>([]);
  const [selectedTile, setSelectedTile] = useState<MahjongTile | null>(null);
  const [pairsLeft, setPairsLeft] = useState(0);
  const [gameWon, setGameWon] = useState(false);

  // Generate Mahjong layout
  const initLayout = () => {
    const tileTypes = [
      { type: 'bamboo-1', symbol: '🎋 1', color: 'text-emerald-400' },
      { type: 'bamboo-2', symbol: '🎋 2', color: 'text-emerald-400' },
      { type: 'bamboo-3', symbol: '🎋 3', color: 'text-emerald-400' },
      { type: 'char-1', symbol: '一', color: 'text-rose-400' },
      { type: 'char-2', symbol: '二', color: 'text-rose-400' },
      { type: 'char-3', symbol: '三', color: 'text-rose-400' },
      { type: 'dot-1', symbol: '⚪ 1', color: 'text-cyan-400' },
      { type: 'dot-2', symbol: '⚪ 2', color: 'text-cyan-400' },
      { type: 'dragon-red', symbol: '中', color: 'text-rose-500' },
      { type: 'dragon-green', symbol: '發', color: 'text-emerald-500' },
    ];

    // Create 18 matching pairs (36 tiles total for clean mobile/desktop layout)
    const deck: { type: string; symbol: string; color: string }[] = [];
    const numPairs = 12 + Math.min(6, level);
    for (let i = 0; i < numPairs; i++) {
      const t = tileTypes[i % tileTypes.length];
      deck.push(t);
      deck.push(t); // Pair
    }

    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // Arrange in pyramid-like layers (layers 0, 1, 2)
    const generated: MahjongTile[] = [];
    let idCounter = 1;

    // Layer 0 (6x4 grid)
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 6; c++) {
        if (deck.length > 0) {
          const item = deck.pop()!;
          generated.push({
            id: idCounter++,
            type: item.type,
            symbol: item.symbol,
            color: item.color,
            x: c * 48 + 20,
            y: r * 62 + 20,
            layer: 0,
            removed: false,
          });
        }
      }
    }

    // Layer 1 (Center 4x2)
    for (let r = 1; r < 3; r++) {
      for (let c = 1; c < 5; c++) {
        if (deck.length > 0) {
          const item = deck.pop()!;
          generated.push({
            id: idCounter++,
            type: item.type,
            symbol: item.symbol,
            color: item.color,
            x: c * 48 + 26,
            y: r * 62 + 26,
            layer: 1,
            removed: false,
          });
        }
      }
    }

    setTiles(generated);
    setPairsLeft(numPairs);
    setSelectedTile(null);
  };

  useEffect(() => {
    initLayout();
  }, [level]);

  // Check if tile is free (no tile directly above it on higher layer, and free on left or right)
  const isTileFree = (t: MahjongTile): boolean => {
    // Check if any active tile is on higher layer overlapping
    const covered = tiles.some(
      (other) =>
        !other.removed &&
        other.layer > t.layer &&
        Math.abs(other.x - t.x) < 40 &&
        Math.abs(other.y - t.y) < 50
    );
    if (covered) return false;

    // Check left and right neighbor on same layer
    const hasLeft = tiles.some(
      (other) =>
        !other.removed &&
        other.layer === t.layer &&
        Math.abs(other.y - t.y) < 30 &&
        other.x < t.x &&
        t.x - other.x < 50
    );
    const hasRight = tiles.some(
      (other) =>
        !other.removed &&
        other.layer === t.layer &&
        Math.abs(other.y - t.y) < 30 &&
        other.x > t.x &&
        other.x - t.x < 50
    );

    return !(hasLeft && hasRight); // Free if at least one side is open
  };

  const handleTileClick = (t: MahjongTile) => {
    if (t.removed || !isTileFree(t)) return;

    if (!selectedTile) {
      setSelectedTile(t);
      sound.playCardFlip();
    } else if (selectedTile.id === t.id) {
      setSelectedTile(null);
    } else if (selectedTile.type === t.type) {
      // Matched pair!
      sound.playCoin();
      const updated = tiles.map((tile) =>
        tile.id === t.id || tile.id === selectedTile.id ? { ...tile, removed: true } : tile
      );
      setTiles(updated);
      setSelectedTile(null);
      const remaining = pairsLeft - 1;
      setPairsLeft(remaining);

      if (remaining <= 0) {
        sound.playWin();
        setGameWon(true);
      }
    } else {
      // Mismatch
      sound.playTone(300, 'sine', 0.05);
      setSelectedTile(t);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[460px] bg-slate-950 flex flex-col justify-between p-4 sm:p-6 select-none overflow-hidden">
      {/* Top HUD */}
      <div className="flex items-center justify-between text-xs font-mono text-white pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
          <span className="text-cyan-400 font-bold">LAYOUT {level} / 25</span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400 font-bold">🎋 PAIRS LEFT: {pairsLeft}</span>
        </div>

        <button
          onClick={initLayout}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold"
        >
          Shuffle Board
        </button>
      </div>

      {/* Mahjong Tile Board Layout */}
      <div className="relative flex-1 flex items-center justify-center my-4 overflow-auto">
        <div className="relative w-[340px] h-[300px] sm:w-[420px] sm:h-[340px]">
          {tiles.map((t) => {
            if (t.removed) return null;
            const free = isTileFree(t);
            const isSelected = selectedTile?.id === t.id;

            return (
              <div
                key={t.id}
                onClick={() => handleTileClick(t)}
                style={{
                  left: `${t.x}px`,
                  top: `${t.y}px`,
                  zIndex: t.layer * 10 + 2,
                }}
                className={`absolute w-11 h-14 sm:w-12 sm:h-16 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all shadow-lg ${
                  isSelected
                    ? 'bg-amber-100 ring-4 ring-cyan-400 scale-105'
                    : free
                    ? 'bg-slate-100 hover:bg-white border-b-4 border-r-2 border-slate-300'
                    : 'bg-slate-300 opacity-60 cursor-not-allowed border-b-2 border-slate-400'
                }`}
              >
                <span className={`text-sm sm:text-base font-bold ${t.color}`}>
                  {t.symbol}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center text-xs text-slate-400">
        Match identical free tiles (tiles not covered or trapped on both sides) to clear the layout.
      </div>

      {gameWon && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-cyan-400">MAHJONG CLEARED!</h2>
          <p className="text-slate-300 text-sm mt-2">All bamboo, character, and dragon tiles matched.</p>
          <button
            onClick={() => {
              setGameWon(false);
              onNextLevel();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm shadow-lg"
          >
            Next Layout (Layout {Math.min(25, level + 1)})
          </button>
        </div>
      )}
    </div>
  );
};
