import React, { useState, useEffect } from 'react';
import { ActiveGameContext } from '../types';
import { sound } from '../utils/audio';

interface Card {
  suit: '♠' | '♥' | '♦' | '♣';
  value: string;
  weight: number;
}

export const Ace21: React.FC<ActiveGameContext> = ({
  level,
  onNextLevel,
  onRestart,
}) => {
  const [chips, setChips] = useState(500 + level * 100);
  const [currentBet, setCurrentBet] = useState(50);
  const [targetBankroll, setTargetBankroll] = useState(1000 + level * 300);

  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'dealerTurn' | 'roundOver'>('betting');
  const [message, setMessage] = useState('Place your bet to deal hand');
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const suits: ('♠' | '♥' | '♦' | '♣')[] = ['♠', '♥', '♦', '♣'];
  const values = [
    { v: 'A', w: 11 },
    { v: '2', w: 2 },
    { v: '3', w: 3 },
    { v: '4', w: 4 },
    { v: '5', w: 5 },
    { v: '6', w: 6 },
    { v: '7', w: 7 },
    { v: '8', w: 8 },
    { v: '9', w: 9 },
    { v: '10', w: 10 },
    { v: 'J', w: 10 },
    { v: 'Q', w: 10 },
    { v: 'K', w: 10 },
  ];

  const drawCard = (): Card => {
    const s = suits[Math.floor(Math.random() * suits.length)];
    const val = values[Math.floor(Math.random() * values.length)];
    return { suit: s, value: val.v, weight: val.w };
  };

  const calculateHandScore = (hand: Card[]): number => {
    let sum = 0;
    let aces = 0;
    for (const c of hand) {
      if (c.value === 'A') {
        aces++;
        sum += 11;
      } else {
        sum += c.weight;
      }
    }
    while (sum > 21 && aces > 0) {
      sum -= 10;
      aces--;
    }
    return sum;
  };

  const startDeal = () => {
    if (chips < currentBet) return;
    setChips((c) => c - currentBet);

    sound.playCardFlip();
    const p1 = drawCard();
    const d1 = drawCard();
    const p2 = drawCard();
    const d2 = drawCard();

    setPlayerHand([p1, p2]);
    setDealerHand([d1, d2]);
    setGameState('playing');
    setMessage('Your turn: Hit or Stand?');

    const pScore = calculateHandScore([p1, p2]);
    if (pScore === 21) {
      // Natural Blackjack!
      setTimeout(() => {
        resolveRound([p1, p2], [d1, d2]);
      }, 600);
    }
  };

  const hit = () => {
    sound.playCardFlip();
    const nextCard = drawCard();
    const newHand = [...playerHand, nextCard];
    setPlayerHand(newHand);

    const score = calculateHandScore(newHand);
    if (score > 21) {
      // Bust
      sound.playHit();
      setGameState('roundOver');
      setMessage(`Bust with ${score}! Dealer wins hand.`);
      checkBankroll(chips);
    }
  };

  const stand = () => {
    setGameState('dealerTurn');
    sound.playCardFlip();

    // Dealer AI draws until at least 17
    let dHand = [...dealerHand];
    while (calculateHandScore(dHand) < 17) {
      dHand.push(drawCard());
    }
    setDealerHand(dHand);
    resolveRound(playerHand, dHand);
  };

  const doubleDown = () => {
    if (chips < currentBet) return;
    setChips((c) => c - currentBet);
    const newBet = currentBet * 2;

    sound.playCardFlip();
    const nextCard = drawCard();
    const newHand = [...playerHand, nextCard];
    setPlayerHand(newHand);

    let dHand = [...dealerHand];
    while (calculateHandScore(dHand) < 17) {
      dHand.push(drawCard());
    }
    setDealerHand(dHand);
    resolveRound(newHand, dHand, newBet);
  };

  const resolveRound = (pHand: Card[], dHand: Card[], bet = currentBet) => {
    const pScore = calculateHandScore(pHand);
    const dScore = calculateHandScore(dHand);

    setGameState('roundOver');

    if (pScore > 21) {
      sound.playHit();
      setMessage(`Bust! You scored ${pScore}.`);
      checkBankroll(chips);
    } else if (dScore > 21) {
      sound.playWin();
      const winChips = chips + bet * 2;
      setChips(winChips);
      setMessage(`Dealer busts with ${dScore}! You win +$${bet * 2}`);
      checkBankroll(winChips);
    } else if (pScore > dScore) {
      sound.playWin();
      const winChips = chips + bet * 2;
      setChips(winChips);
      setMessage(`You win ${pScore} vs ${dScore}! +$${bet * 2}`);
      checkBankroll(winChips);
    } else if (pScore < dScore) {
      sound.playHit();
      setMessage(`Dealer wins ${dScore} vs ${pScore}.`);
      checkBankroll(chips);
    } else {
      // Push
      sound.playTone(400, 'sine', 0.1);
      const pushChips = chips + bet;
      setChips(pushChips);
      setMessage(`Push! Tied at ${pScore}. Bets returned.`);
      checkBankroll(pushChips);
    }
  };

  const checkBankroll = (newChips: number) => {
    if (newChips >= targetBankroll) {
      sound.playWin();
      setGameWon(true);
    } else if (newChips <= 0) {
      setGameOver(true);
    }
  };

  const playerScore = calculateHandScore(playerHand);
  const dealerVisibleScore =
    gameState === 'playing' ? dealerHand[0]?.weight || 0 : calculateHandScore(dealerHand);

  return (
    <div className="relative w-full h-full min-h-[460px] bg-slate-950 flex flex-col justify-between p-6 select-none overflow-hidden">
      {/* Table Felt Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950 via-slate-950 to-slate-950 -z-10" />

      {/* Top HUD */}
      <div className="flex items-center justify-between text-xs font-mono text-white pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
          <span className="text-cyan-400 font-bold">CASINO LEVEL {level} / 30</span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400 font-bold">BANKROLL: ${chips}</span>
        </div>

        <div className="bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
          <span className="text-emerald-400 font-bold">TARGET: ${targetBankroll}</span>
        </div>
      </div>

      {/* Dealer Zone */}
      <div className="flex flex-col items-center mt-2">
        <span className="text-xs text-slate-400 mb-2 font-medium">
          DEALER {gameState !== 'playing' ? `(${dealerVisibleScore})` : ''}
        </span>
        <div className="flex gap-3">
          {dealerHand.map((card, idx) => {
            const isHidden = gameState === 'playing' && idx === 1;
            return (
              <div
                key={idx}
                className={`w-16 h-24 sm:w-20 sm:h-28 rounded-xl flex flex-col justify-between p-2 shadow-lg transition-transform ${
                  isHidden
                    ? 'bg-blue-900 border-2 border-cyan-400'
                    : 'bg-white border border-slate-300'
                }`}
              >
                {isHidden ? (
                  <div className="h-full flex items-center justify-center text-cyan-300 text-xs font-bold">
                    OffGamX
                  </div>
                ) : (
                  <>
                    <span
                      className={`text-sm font-bold ${
                        ['♥', '♦'].includes(card.suit) ? 'text-rose-600' : 'text-slate-900'
                      }`}
                    >
                      {card.value}
                    </span>
                    <span
                      className={`text-2xl self-center ${
                        ['♥', '♦'].includes(card.suit) ? 'text-rose-600' : 'text-slate-900'
                      }`}
                    >
                      {card.suit}
                    </span>
                    <span
                      className={`text-sm font-bold self-end ${
                        ['♥', '♦'].includes(card.suit) ? 'text-rose-600' : 'text-slate-900'
                      }`}
                    >
                      {card.value}
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Center Status Banner */}
      <div className="text-center my-3">
        <span className="px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700 text-xs font-semibold text-cyan-300">
          {message}
        </span>
      </div>

      {/* Player Zone */}
      <div className="flex flex-col items-center">
        <span className="text-xs text-slate-400 mb-2 font-medium">
          PLAYER ({playerScore})
        </span>
        <div className="flex gap-3">
          {playerHand.map((card, idx) => (
            <div
              key={idx}
              className="w-16 h-24 sm:w-20 sm:h-28 rounded-xl bg-white border border-slate-300 flex flex-col justify-between p-2 shadow-lg"
            >
              <span
                className={`text-sm font-bold ${
                  ['♥', '♦'].includes(card.suit) ? 'text-rose-600' : 'text-slate-900'
                }`}
              >
                {card.value}
              </span>
              <span
                className={`text-2xl self-center ${
                  ['♥', '♦'].includes(card.suit) ? 'text-rose-600' : 'text-slate-900'
                }`}
              >
                {card.suit}
              </span>
              <span
                className={`text-sm font-bold self-end ${
                  ['♥', '♦'].includes(card.suit) ? 'text-rose-600' : 'text-slate-900'
                }`}
              >
                {card.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Controls & Betting */}
      <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {gameState === 'betting' || gameState === 'roundOver' ? (
          <div className="flex items-center gap-3 w-full justify-center sm:justify-between">
            {/* Chip selector */}
            <div className="flex gap-2">
              {[25, 50, 100, 250].map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    setCurrentBet(amt);
                    sound.playTone(500, 'sine', 0.04);
                  }}
                  className={`w-10 h-10 rounded-full font-bold text-xs flex items-center justify-center border transition-all ${
                    currentBet === amt
                      ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md scale-105'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>

            <button
              onClick={startDeal}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-cyan-500/25"
            >
              DEAL HAND (${currentBet})
            </button>
          </div>
        ) : (
          <div className="flex gap-3 mx-auto">
            <button
              onClick={hit}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md"
            >
              HIT
            </button>
            <button
              onClick={stand}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
            >
              STAND
            </button>
            <button
              onClick={doubleDown}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md"
            >
              DOUBLE
            </button>
          </div>
        )}
      </div>

      {gameOver && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-rose-500">BANKROLL EMPTY!</h2>
          <p className="text-slate-300 text-sm mt-2">The house won this table session.</p>
          <button
            onClick={() => {
              setGameOver(false);
              onRestart();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg"
          >
            Re-buy Chips
          </button>
        </div>
      )}

      {gameWon && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-cyan-400">TABLE BROKEN!</h2>
          <p className="text-slate-300 text-sm mt-2">Target bankroll of ${targetBankroll} achieved!</p>
          <button
            onClick={() => {
              setGameWon(false);
              onNextLevel();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm shadow-lg"
          >
            High Roller Table (Level {Math.min(30, level + 1)})
          </button>
        </div>
      )}
    </div>
  );
};
