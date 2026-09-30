import React, { useState, useEffect } from 'react';
import { ActiveGameContext } from '../types';
import { sound } from '../utils/audio';

export const SudokuGrid: React.FC<ActiveGameContext> = ({
  level,
  onNextLevel,
  onRestart,
}) => {
  // 9x9 board representation
  const [board, setBoard] = useState<number[][]>([]);
  const [initialBoard, setInitialBoard] = useState<boolean[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [notesMode, setNotesMode] = useState<boolean>(false);
  const [notes, setNotes] = useState<Record<string, number[]>>({});
  const [mistakes, setMistakes] = useState<number>(0);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // Generate Sudoku puzzle for level
  const generatePuzzle = () => {
    // Valid solved base grid (derivation of standard template)
    const base = [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ];

    // Permute rows / cols based on level
    const shift = (level * 3) % 9;
    const solved = base.map((row) => row.map((v) => ((v + shift - 1) % 9) + 1));

    // Punch holes according to difficulty
    const holes = 30 + Math.min(30, level * 2);
    const puzzle = solved.map((r) => [...r]);
    const init = puzzle.map(() => Array(9).fill(true));

    let removed = 0;
    while (removed < holes) {
      const r = Math.floor(Math.random() * 9);
      const c = Math.floor(Math.random() * 9);
      if (puzzle[r][c] !== 0) {
        puzzle[r][c] = 0;
        init[r][c] = false;
        removed++;
      }
    }

    setBoard(puzzle);
    setInitialBoard(init);
    setSelectedCell(null);
    setNotes({});
    setMistakes(0);
  };

  useEffect(() => {
    generatePuzzle();
  }, [level]);

  const handleCellClick = (r: number, c: number) => {
    setSelectedCell({ r, c });
    sound.playTone(500, 'sine', 0.03);
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell) return;
    const { r, c } = selectedCell;
    if (initialBoard[r][c]) return; // Immutable given digit

    const key = `${r}-${c}`;

    if (notesMode) {
      // Toggle note
      const curr = notes[key] || [];
      const updated = curr.includes(num) ? curr.filter((n) => n !== num) : [...curr, num].sort();
      setNotes({ ...notes, [key]: updated });
      sound.playTone(700, 'sine', 0.02);
      return;
    }

    // Direct entry
    const newBoard = board.map((row) => [...row]);
    newBoard[r][c] = num;
    setBoard(newBoard);
    sound.playTone(600, 'sine', 0.04);

    // Conflict detection
    let hasConflict = false;
    // Check row & col
    for (let i = 0; i < 9; i++) {
      if (i !== c && newBoard[r][i] === num) hasConflict = true;
      if (i !== r && newBoard[i][c] === num) hasConflict = true;
    }
    // Check 3x3 box
    const br = Math.floor(r / 3) * 3;
    const bc = Math.floor(c / 3) * 3;
    for (let ro = 0; ro < 3; ro++) {
      for (let co = 0; co < 3; co++) {
        if ((br + ro !== r || bc + co !== c) && newBoard[br + ro][bc + co] === num) {
          hasConflict = true;
        }
      }
    }

    if (hasConflict) {
      sound.playHit();
      const nextMistakes = mistakes + 1;
      setMistakes(nextMistakes);
      if (nextMistakes >= 3) {
        setGameOver(true);
        return;
      }
    } else {
      // Check if board fully filled without conflict
      const filled = newBoard.every((row) => row.every((val) => val > 0));
      if (filled) {
        sound.playWin();
        setGameWon(true);
      }
    }
  };

  const eraseCell = () => {
    if (!selectedCell) return;
    const { r, c } = selectedCell;
    if (initialBoard[r][c]) return;

    const newBoard = board.map((row) => [...row]);
    newBoard[r][c] = 0;
    setBoard(newBoard);

    const key = `${r}-${c}`;
    const copyNotes = { ...notes };
    delete copyNotes[key];
    setNotes(copyNotes);
  };

  return (
    <div className="relative w-full h-full min-h-[460px] bg-slate-950 flex flex-col justify-between p-4 sm:p-6 select-none overflow-hidden">
      {/* Top HUD */}
      <div className="flex items-center justify-between text-xs font-mono text-white pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
          <span className="text-cyan-400 font-bold">PUZZLE {level} / 40</span>
          <span className="text-slate-600">|</span>
          <span className="text-rose-400 font-bold">MISTAKES: {mistakes} / 3</span>
        </div>

        <button
          onClick={() => setNotesMode(!notesMode)}
          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            notesMode
              ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}
        >
          <span>Pencil Notes</span>
          <span className="text-[10px] uppercase font-mono">{notesMode ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* 9x9 Sudoku Board */}
      <div className="flex items-center justify-center my-auto">
        <div className="grid grid-cols-9 grid-rows-9 w-80 h-80 sm:w-96 sm:h-96 bg-slate-900 border-4 border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          {board.map((row, r) =>
            row.map((val, c) => {
              const isSelected = selectedCell?.r === r && selectedCell?.c === c;
              const isGiven = initialBoard[r]?.[c];
              const cellNotes = notes[`${r}-${c}`] || [];

              // Thicker borders for 3x3 block separation
              const borderRight = c % 3 === 2 && c !== 8 ? 'border-r-2 border-r-slate-700' : 'border-r border-slate-800/80';
              const borderBottom = r % 3 === 2 && r !== 8 ? 'border-b-2 border-b-slate-700' : 'border-b border-slate-800/80';

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={`relative flex items-center justify-center cursor-pointer transition-colors ${borderRight} ${borderBottom} ${
                    isSelected ? 'bg-cyan-500/20' : 'hover:bg-slate-800'
                  }`}
                >
                  {val > 0 ? (
                    <span
                      className={`text-base sm:text-lg font-bold ${
                        isGiven ? 'text-white' : 'text-cyan-400'
                      }`}
                    >
                      {val}
                    </span>
                  ) : cellNotes.length > 0 ? (
                    <div className="grid grid-cols-3 gap-0.5 text-[8px] text-slate-400 font-mono">
                      {cellNotes.map((n) => (
                        <span key={n}>{n}</span>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Number Keypad */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 pt-3 border-t border-slate-800">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNumberInput(num)}
            className="w-8 h-10 sm:w-10 sm:h-12 rounded-xl bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-white font-bold text-sm sm:text-base border border-slate-700 transition-all active:scale-95"
          >
            {num}
          </button>
        ))}
        <button
          onClick={eraseCell}
          className="px-3 h-10 sm:h-12 rounded-xl bg-slate-800 hover:bg-rose-500 text-white font-bold text-xs border border-slate-700 transition-all"
        >
          Erase
        </button>
      </div>

      {gameOver && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-rose-500">3 MISTAKES!</h2>
          <p className="text-slate-300 text-sm mt-2">Check rows, columns and 3x3 blocks for duplicates.</p>
          <button
            onClick={() => {
              setGameOver(false);
              onRestart();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg"
          >
            Retry Puzzle
          </button>
        </div>
      )}

      {gameWon && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-cyan-400">SUDOKU SOLVED!</h2>
          <p className="text-slate-300 text-sm mt-2">Logical deduction complete with clean validation.</p>
          <button
            onClick={() => {
              setGameWon(false);
              onNextLevel();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm shadow-lg"
          >
            Next Puzzle (Puzzle {Math.min(40, level + 1)})
          </button>
        </div>
      )}
    </div>
  );
};
