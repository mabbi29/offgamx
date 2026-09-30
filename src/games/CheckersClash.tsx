import React, { useState, useEffect } from 'react';
import { ActiveGameContext } from '../types';
import { sound } from '../utils/audio';

type Piece = 'red' | 'red-king' | 'black' | 'black-king' | null;

interface Move {
  fromR: number;
  fromC: number;
  toR: number;
  toC: number;
  capturedR?: number;
  capturedC?: number;
}

export const CheckersClash: React.FC<ActiveGameContext> = ({
  level,
  onNextLevel,
  onRestart,
}) => {
  const [board, setBoard] = useState<Piece[][]>([]);
  const [selectedPiece, setSelectedPiece] = useState<{ r: number; c: number } | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [turn, setTurn] = useState<'red' | 'black'>('red'); // Red = Player, Black = AI
  const [redCount, setRedCount] = useState(12);
  const [blackCount, setBlackCount] = useState(12);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  const initBoard = () => {
    const b: Piece[][] = [];
    for (let r = 0; r < 8; r++) {
      b[r] = [];
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) {
          if (r < 3) b[r][c] = 'black';
          else if (r > 4) b[r][c] = 'red';
          else b[r][c] = null;
        } else {
          b[r][c] = null;
        }
      }
    }
    setBoard(b);
    setRedCount(12);
    setBlackCount(12);
    setTurn('red');
    setSelectedPiece(null);
    setValidMoves([]);
  };

  useEffect(() => {
    initBoard();
  }, [level]);

  // Compute legal moves for a color
  const getMovesForColor = (currBoard: Piece[][], color: 'red' | 'black'): Move[] => {
    const moves: Move[] = [];
    const jumpMoves: Move[] = [];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = currBoard[r][c];
        if (!piece || !piece.startsWith(color)) continue;

        const isKing = piece.includes('king');
        const directions = isKing
          ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
          : color === 'red'
          ? [[-1, -1], [-1, 1]] // Red moves up
          : [[1, -1], [1, 1]]; // Black moves down

        for (const [dr, dc] of directions) {
          const nr = r + dr;
          const nc = c + dc;

          // Regular slide
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && currBoard[nr][nc] === null) {
            moves.push({ fromR: r, fromC: c, toR: nr, toC: nc });
          }

          // Jump capture
          const jr = r + dr * 2;
          const jc = c + dc * 2;
          if (jr >= 0 && jr < 8 && jc >= 0 && jc < 8 && currBoard[jr][jc] === null) {
            const mid = currBoard[nr][nc];
            const enemy = color === 'red' ? 'black' : 'red';
            if (mid && mid.startsWith(enemy)) {
              jumpMoves.push({
                fromR: r,
                fromC: c,
                toR: jr,
                toC: jc,
                capturedR: nr,
                capturedC: nc,
              });
            }
          }
        }
      }
    }

    // Forced jump rule: if jumps exist, player/ai must take a jump
    return jumpMoves.length > 0 ? jumpMoves : moves;
  };

  const handleTileClick = (r: number, c: number) => {
    if (turn !== 'red') return;

    const clickedPiece = board[r]?.[c];

    // If already selected a piece, check if click is a valid move
    if (selectedPiece) {
      const move = validMoves.find((m) => m.toR === r && m.toC === c);
      if (move) {
        executeMove(move);
        return;
      }
    }

    // Select friendly red piece
    if (clickedPiece && clickedPiece.startsWith('red')) {
      const allMoves = getMovesForColor(board, 'red');
      const pieceMoves = allMoves.filter((m) => m.fromR === r && m.fromC === c);

      if (pieceMoves.length > 0) {
        setSelectedPiece({ r, c });
        setValidMoves(pieceMoves);
        sound.playCardFlip();
      }
    }
  };

  const executeMove = (m: Move) => {
    const newBoard = board.map((row) => [...row]);
    const piece = newBoard[m.fromR][m.fromC];
    newBoard[m.fromR][m.fromC] = null;

    // Check coronation
    let finalPiece = piece;
    if (piece === 'red' && m.toR === 0) finalPiece = 'red-king';
    if (piece === 'black' && m.toR === 7) finalPiece = 'black-king';

    newBoard[m.toR][m.toC] = finalPiece;

    if (m.capturedR !== undefined && m.capturedC !== undefined) {
      newBoard[m.capturedR][m.capturedC] = null;
      sound.playWhack();
    } else {
      sound.playTone(350, 'sine', 0.05);
    }

    // Update counts
    let rC = 0;
    let bC = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (newBoard[r][c]?.startsWith('red')) rC++;
        if (newBoard[r][c]?.startsWith('black')) bC++;
      }
    }
    setRedCount(rC);
    setBlackCount(bC);
    setBoard(newBoard);
    setSelectedPiece(null);
    setValidMoves([]);

    if (bC === 0) {
      sound.playWin();
      setGameWon(true);
      return;
    }
    if (rC === 0) {
      sound.playHit();
      setGameOver(true);
      return;
    }

    // Pass turn to AI
    setTurn('black');
  };

  // AI Turn
  useEffect(() => {
    if (turn === 'black' && !gameOver && !gameWon) {
      const timer = setTimeout(() => {
        const aiMoves = getMovesForColor(board, 'black');
        if (aiMoves.length === 0) {
          // AI has no moves, player wins
          sound.playWin();
          setGameWon(true);
          return;
        }

        // AI picks jump capture if available, or best positional move
        const jumps = aiMoves.filter((m) => m.capturedR !== undefined);
        const chosen = jumps.length > 0
          ? jumps[Math.floor(Math.random() * jumps.length)]
          : aiMoves[Math.floor(Math.random() * aiMoves.length)];

        executeMove(chosen);
        setTurn('red');
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [turn, board, gameOver, gameWon]);

  return (
    <div className="relative w-full h-full min-h-[460px] bg-slate-950 flex flex-col justify-between p-4 sm:p-6 select-none overflow-hidden">
      {/* Top HUD */}
      <div className="flex items-center justify-between text-xs font-mono text-white pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
          <span className="text-cyan-400 font-bold">MATCH {level} / 20</span>
          <span className="text-slate-600">|</span>
          <span className="text-rose-400 font-bold">RED: {redCount}</span>
          <span className="text-slate-600">vs</span>
          <span className="text-slate-400 font-bold">BLACK (AI): {blackCount}</span>
        </div>

        <div className="bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
          <span className={turn === 'red' ? 'text-cyan-400 font-bold' : 'text-slate-500'}>
            {turn === 'red' ? 'YOUR TURN' : 'AI CALCULATING...'}
          </span>
        </div>
      </div>

      {/* 8x8 Checkers Board */}
      <div className="flex items-center justify-center my-auto">
        <div className="grid grid-cols-8 grid-rows-8 w-80 h-80 sm:w-96 sm:h-96 rounded-2xl overflow-hidden border-4 border-slate-800 shadow-2xl">
          {board.map((row, r) =>
            row.map((piece, c) => {
              const isDark = (r + c) % 2 === 1;
              const isSelected = selectedPiece?.r === r && selectedPiece?.c === c;
              const isValidTarget = validMoves.some((m) => m.toR === r && m.toC === c);

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleTileClick(r, c)}
                  className={`relative flex items-center justify-center cursor-pointer transition-colors ${
                    isDark ? 'bg-slate-800' : 'bg-slate-700/50'
                  } ${isSelected ? 'ring-2 ring-cyan-400' : ''}`}
                >
                  {/* Valid move indicator dot */}
                  {isValidTarget && (
                    <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-md animate-pulse z-10" />
                  )}

                  {/* Piece */}
                  {piece && (
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-md transform transition-transform ${
                        piece.startsWith('red')
                          ? 'bg-rose-500 text-white border-2 border-rose-300'
                          : 'bg-slate-950 text-slate-300 border-2 border-slate-600'
                      }`}
                    >
                      {piece.includes('king') ? '♔' : ''}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="text-center text-xs text-slate-400">
        Click your red pieces to view valid moves. Forced jump rule active.
      </div>

      {gameOver && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-rose-500">CHECKERS DEFEAT!</h2>
          <p className="text-slate-300 text-sm mt-2">All red pieces captured by AI bot.</p>
          <button
            onClick={() => {
              setGameOver(false);
              onRestart();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg"
          >
            Play Rematch
          </button>
        </div>
      )}

      {gameWon && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-cyan-400">CHECKERS VICTORY!</h2>
          <p className="text-slate-300 text-sm mt-2">All black pieces jumped and crowned!</p>
          <button
            onClick={() => {
              setGameWon(false);
              onNextLevel();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm shadow-lg"
          >
            Next Difficulty (Level {Math.min(20, level + 1)})
          </button>
        </div>
      )}
    </div>
  );
};
