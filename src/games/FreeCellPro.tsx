import React, { useState, useEffect } from 'react';
import { ActiveGameContext } from '../types';
import { sound } from '../utils/audio';

interface Card {
  id: string;
  suit: '♠' | '♥' | '♦' | '♣';
  value: number; // 1 (Ace) to 13 (King)
  label: string;
  color: 'red' | 'black';
}

export const FreeCellPro: React.FC<ActiveGameContext> = ({
  level,
  onNextLevel,
  onRestart,
}) => {
  const [freeCells, setFreeCells] = useState<(Card | null)[]>([null, null, null, null]);
  const [foundations, setFoundations] = useState<Card[][]>([[], [], [], []]);
  const [cascades, setCascades] = useState<Card[][]>([[], [], [], [], [], [], [], []]);
  const [selectedCard, setSelectedCard] = useState<{
    card: Card;
    source: 'freecell' | 'cascade';
    sourceIndex: number;
  } | null>(null);
  const [movesCount, setMovesCount] = useState(0);
  const [gameWon, setGameWon] = useState(false);

  // Generate full 52-card deck
  const initDeal = () => {
    const suits: ('♠' | '♥' | '♦' | '♣')[] = ['♠', '♥', '♦', '♣'];
    const labels = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck: Card[] = [];

    for (const s of suits) {
      for (let v = 1; v <= 13; v++) {
        deck.push({
          id: `${s}-${v}`,
          suit: s,
          value: v,
          label: labels[v - 1],
          color: ['♥', '♦'].includes(s) ? 'red' : 'black',
        });
      }
    }

    // Seeded shuffle based on level deal
    let seed = level * 1337 + 42;
    for (let i = deck.length - 1; i > 0; i--) {
      seed = (seed * 9301 + 49297) % 233280;
      const j = Math.floor((seed / 233280) * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // Deal into 8 cascades
    const newCascades: Card[][] = [[], [], [], [], [], [], [], []];
    deck.forEach((card, idx) => {
      newCascades[idx % 8].push(card);
    });

    setCascades(newCascades);
    setFreeCells([null, null, null, null]);
    setFoundations([[], [], [], []]);
    setSelectedCard(null);
    setMovesCount(0);
  };

  useEffect(() => {
    initDeal();
  }, [level]);

  // Click on FreeCell
  const handleFreeCellClick = (idx: number) => {
    if (selectedCard) {
      // Place into free cell if empty
      if (freeCells[idx] === null) {
        const nextFree = [...freeCells];
        nextFree[idx] = selectedCard.card;
        setFreeCells(nextFree);
        removeSourceCard(selectedCard);
        sound.playCardFlip();
      }
      setSelectedCard(null);
    } else if (freeCells[idx] !== null) {
      setSelectedCard({
        card: freeCells[idx]!,
        source: 'freecell',
        sourceIndex: idx,
      });
      sound.playTone(500, 'sine', 0.03);
    }
  };

  // Click on Foundation
  const handleFoundationClick = (idx: number) => {
    if (!selectedCard) return;
    const card = selectedCard.card;
    const pile = foundations[idx];

    // Can place Ace on empty foundation, or next sequential value of same suit
    const canPlace =
      (pile.length === 0 && card.value === 1) ||
      (pile.length > 0 &&
        pile[pile.length - 1].suit === card.suit &&
        pile[pile.length - 1].value === card.value - 1);

    if (canPlace) {
      const nextFound = [...foundations];
      nextFound[idx] = [...pile, card];
      setFoundations(nextFound);
      removeSourceCard(selectedCard);
      sound.playCoin();
      checkWin(nextFound);
    }
    setSelectedCard(null);
  };

  // Click on Cascade column
  const handleCascadeClick = (colIdx: number) => {
    const col = cascades[colIdx];

    if (selectedCard) {
      const card = selectedCard.card;
      const canPlace =
        col.length === 0 ||
        (col[col.length - 1].color !== card.color &&
          col[col.length - 1].value === card.value + 1);

      if (canPlace) {
        const nextCascades = cascades.map((c, i) =>
          i === colIdx ? [...c, card] : [...c]
        );
        setCascades(nextCascades);
        removeSourceCard(selectedCard);
        sound.playCardFlip();
      }
      setSelectedCard(null);
    } else if (col.length > 0) {
      const topCard = col[col.length - 1];
      setSelectedCard({
        card: topCard,
        source: 'cascade',
        sourceIndex: colIdx,
      });
      sound.playTone(500, 'sine', 0.03);
    }
  };

  const removeSourceCard = (sel: {
    card: Card;
    source: 'freecell' | 'cascade';
    sourceIndex: number;
  }) => {
    setMovesCount((m) => m + 1);
    if (sel.source === 'freecell') {
      const nextFree = [...freeCells];
      nextFree[sel.sourceIndex] = null;
      setFreeCells(nextFree);
    } else {
      const nextCascades = cascades.map((col, idx) =>
        idx === sel.sourceIndex ? col.slice(0, -1) : col
      );
      setCascades(nextCascades);
    }
  };

  const checkWin = (nextFound: Card[][]) => {
    const totalInFoundations = nextFound.reduce((sum, f) => sum + f.length, 0);
    if (totalInFoundations === 52) {
      sound.playWin();
      setGameWon(true);
    }
  };

  // Auto-move cards to foundation if possible
  const autoMove = () => {
    let moved = false;
    const nextFound = [...foundations];
    const nextFree = [...freeCells];
    const nextCascades = cascades.map((c) => [...c]);

    // Check freecells
    for (let i = 0; i < 4; i++) {
      const card = nextFree[i];
      if (card) {
        for (let f = 0; f < 4; f++) {
          const pile = nextFound[f];
          if (
            (pile.length === 0 && card.value === 1) ||
            (pile.length > 0 &&
              pile[pile.length - 1].suit === card.suit &&
              pile[pile.length - 1].value === card.value - 1)
          ) {
            nextFound[f].push(card);
            nextFree[i] = null;
            moved = true;
            sound.playCoin();
            break;
          }
        }
      }
    }

    // Check cascades
    for (let c = 0; c < 8; c++) {
      if (nextCascades[c].length > 0) {
        const card = nextCascades[c][nextCascades[c].length - 1];
        for (let f = 0; f < 4; f++) {
          const pile = nextFound[f];
          if (
            (pile.length === 0 && card.value === 1) ||
            (pile.length > 0 &&
              pile[pile.length - 1].suit === card.suit &&
              pile[pile.length - 1].value === card.value - 1)
          ) {
            nextFound[f].push(card);
            nextCascades[c].pop();
            moved = true;
            sound.playCoin();
            break;
          }
        }
      }
    }

    if (moved) {
      setFoundations(nextFound);
      setFreeCells(nextFree);
      setCascades(nextCascades);
      checkWin(nextFound);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[460px] bg-slate-950 flex flex-col justify-between p-4 sm:p-6 select-none overflow-hidden">
      {/* Top HUD */}
      <div className="flex items-center justify-between text-xs font-mono text-white pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
          <span className="text-cyan-400 font-bold">DEAL #{level} / 30</span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400 font-bold">MOVES: {movesCount}</span>
        </div>

        <button
          onClick={autoMove}
          className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow transition-colors"
        >
          Auto-Move
        </button>
      </div>

      {/* Top row: 4 Free Cells & 4 Foundations */}
      <div className="flex justify-between items-center my-3 max-w-2xl mx-auto w-full">
        {/* Free Cells */}
        <div className="flex gap-2">
          {freeCells.map((card, idx) => (
            <div
              key={idx}
              onClick={() => handleFreeCellClick(idx)}
              className={`w-12 h-16 sm:w-14 sm:h-20 rounded-xl border-2 flex items-center justify-center cursor-pointer transition-all ${
                card
                  ? 'bg-white border-slate-300 shadow-md'
                  : 'bg-slate-900/80 border-dashed border-slate-700 hover:border-cyan-400'
              } ${selectedCard?.card.id === card?.id ? 'ring-2 ring-cyan-400 scale-105' : ''}`}
            >
              {card && (
                <span
                  className={`text-xs sm:text-sm font-bold ${
                    card.color === 'red' ? 'text-rose-600' : 'text-slate-900'
                  }`}
                >
                  {card.label} {card.suit}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Foundation Piles */}
        <div className="flex gap-2">
          {foundations.map((pile, idx) => {
            const top = pile.length > 0 ? pile[pile.length - 1] : null;
            return (
              <div
                key={idx}
                onClick={() => handleFoundationClick(idx)}
                className="w-12 h-16 sm:w-14 sm:h-20 rounded-xl bg-slate-900 border-2 border-slate-700 flex items-center justify-center cursor-pointer hover:border-emerald-400 transition-colors"
              >
                {top ? (
                  <span
                    className={`text-xs sm:text-sm font-bold ${
                      top.color === 'red' ? 'text-rose-500' : 'text-slate-200'
                    }`}
                  >
                    {top.label} {top.suit}
                  </span>
                ) : (
                  <span className="text-slate-600 text-xs font-bold">♠♥♦♣</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 8 Cascade Columns */}
      <div className="flex-1 grid grid-cols-8 gap-1.5 sm:gap-2 max-w-3xl mx-auto w-full my-2 overflow-y-auto">
        {cascades.map((col, colIdx) => (
          <div
            key={colIdx}
            onClick={() => handleCascadeClick(colIdx)}
            className="flex flex-col items-center min-h-[140px] rounded-lg hover:bg-slate-900/40 p-1 cursor-pointer"
          >
            {col.map((card, cIdx) => {
              const isSelected = selectedCard?.card.id === card.id;
              return (
                <div
                  key={card.id}
                  style={{ marginTop: cIdx === 0 ? 0 : -35 }}
                  className={`w-10 sm:w-12 h-14 sm:h-18 rounded-lg bg-white border border-slate-300 shadow flex flex-col justify-between p-1 z-10 transition-transform ${
                    isSelected ? 'ring-2 ring-cyan-400 -translate-y-2' : ''
                  }`}
                >
                  <span
                    className={`text-[10px] sm:text-xs font-bold leading-none ${
                      card.color === 'red' ? 'text-rose-600' : 'text-slate-900'
                    }`}
                  >
                    {card.label}
                  </span>
                  <span
                    className={`text-xs self-center leading-none ${
                      card.color === 'red' ? 'text-rose-600' : 'text-slate-900'
                    }`}
                  >
                    {card.suit}
                  </span>
                  <span
                    className={`text-[10px] sm:text-xs font-bold self-end leading-none ${
                      card.color === 'red' ? 'text-rose-600' : 'text-slate-900'
                    }`}
                  >
                    {card.label}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="text-center text-xs text-slate-400">
        Build cascading columns down in alternating colors. Transfer Aces through Kings to foundations.
      </div>

      {gameWon && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-cyan-400">DEAL COMPLETE!</h2>
          <p className="text-slate-300 text-sm mt-2">All 52 cards built onto foundation piles in {movesCount} moves.</p>
          <button
            onClick={() => {
              setGameWon(false);
              onNextLevel();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm shadow-lg"
          >
            Next Deal (Deal #{Math.min(30, level + 1)})
          </button>
        </div>
      )}
    </div>
  );
};
