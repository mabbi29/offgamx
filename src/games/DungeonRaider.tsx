import React, { useRef, useEffect, useState } from 'react';
import { ActiveGameContext } from '../types';
import { sound } from '../utils/audio';

export const DungeonRaider: React.FC<ActiveGameContext> = ({
  level,
  isPaused,
  onNextLevel,
  onRestart,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [hp, setHp] = useState(100);
  const [gold, setGold] = useState(0);
  const [hasKey, setHasKey] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const rows = 9;
    const cols = 11;

    // 0 = Floor, 1 = Wall, 2 = Chest, 3 = Potion, 4 = Key, 5 = Exit Stairs
    const grid: number[][] = [];
    for (let r = 0; r < rows; r++) {
      grid[r] = [];
      for (let c = 0; c < cols; c++) {
        if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
          grid[r][c] = 1;
        } else if (r % 2 === 0 && c % 2 === 0 && Math.random() < 0.6) {
          grid[r][c] = 1; // Pillars
        } else {
          grid[r][c] = 0;
        }
      }
    }

    let pR = 1;
    let pC = 1;
    let playerHp = 100;
    let playerGold = 0;
    let keyCollected = false;

    // Place Key, Stairs, Chest, Potion
    const stairsR = rows - 2;
    const stairsC = cols - 2;
    grid[stairsR][stairsC] = 5;

    grid[rows - 2][1] = 4; // Key
    grid[1][cols - 2] = 2; // Chest
    grid[Math.floor(rows / 2)][Math.floor(cols / 2)] = 3; // Potion

    interface Monster {
      r: number;
      c: number;
      hp: number;
    }
    const monsters: Monster[] = [
      { r: 3, c: 5, hp: 2 },
      { r: 6, c: 7, hp: 2 },
    ];
    if (level > 4) {
      monsters.push({ r: 5, c: 3, hp: 3 });
    }

    const tryMove = (dr: number, dc: number) => {
      const nr = pR + dr;
      const nc = pC + dc;

      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) return;
      if (grid[nr][nc] === 1) return; // Wall

      // Check monster at target
      const mon = monsters.find((m) => m.r === nr && m.c === nc);
      if (mon) {
        mon.hp -= 1;
        sound.playHit();
        playerHp -= 12;
        setHp(Math.max(0, playerHp));

        if (mon.hp <= 0) {
          const idx = monsters.indexOf(mon);
          monsters.splice(idx, 1);
          playerGold += 50;
          setGold(playerGold);
          sound.playWhack();
        }

        if (playerHp <= 0) {
          sound.playExplosion();
          setGameOver(true);
          return;
        }
        return;
      }

      pR = nr;
      pC = nc;

      // Check tiles
      if (grid[pR][pC] === 2) {
        // Chest
        grid[pR][pC] = 0;
        playerGold += 100;
        setGold(playerGold);
        sound.playCoin();
      } else if (grid[pR][pC] === 3) {
        // Potion
        grid[pR][pC] = 0;
        playerHp = Math.min(100, playerHp + 40);
        setHp(playerHp);
        sound.playTone(700, 'sine', 0.1);
      } else if (grid[pR][pC] === 4) {
        // Key
        grid[pR][pC] = 0;
        keyCollected = true;
        setHasKey(true);
        sound.playTone(900, 'sine', 0.12);
      } else if (grid[pR][pC] === 5) {
        // Stairs
        if (keyCollected) {
          sound.playWin();
          setGameWon(true);
        } else {
          sound.playTone(300, 'square', 0.08); // Locked sound
        }
      } else {
        sound.playTone(400, 'sine', 0.03); // Step
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) { e.preventDefault(); tryMove(0, -1); }
      if (['ArrowRight', 'KeyD'].includes(e.code)) { e.preventDefault(); tryMove(0, 1); }
      if (['ArrowUp', 'KeyW'].includes(e.code)) { e.preventDefault(); tryMove(-1, 0); }
      if (['ArrowDown', 'KeyS'].includes(e.code)) { e.preventDefault(); tryMove(1, 0); }
    };

    window.addEventListener('keydown', handleKeyDown);

    const updateSize = () => {
      if (!containerRef.current || !canvas) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.scale(dpr, dpr);
    };

    const ro = new ResizeObserver(updateSize);
    if (containerRef.current) ro.observe(containerRef.current);
    updateSize();

    const loop = () => {
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);

      const cellW = w / cols;
      const cellH = h / rows;

      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);

      // Render Crypt Tiles
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * cellW;
          const y = r * cellH;

          // Dungeon flagstone floor
          ctx.fillStyle = (r + c) % 2 === 0 ? '#1e293b' : '#0f172a';
          ctx.fillRect(x, y, cellW, cellH);

          if (grid[r][c] === 1) {
            // Stone Wall
            ctx.fillStyle = '#334155';
            ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);
          } else if (grid[r][c] === 2) {
            // Chest
            ctx.fillStyle = '#b45309';
            ctx.fillRect(x + cellW * 0.25, y + cellH * 0.25, cellW * 0.5, cellH * 0.5);
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(x + cellW * 0.4, y + cellH * 0.4, cellW * 0.2, cellH * 0.2);
          } else if (grid[r][c] === 3) {
            // Potion
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(x + cellW * 0.5, y + cellH * 0.5, 10, 0, Math.PI * 2);
            ctx.fill();
          } else if (grid[r][c] === 4) {
            // Key
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(x + cellW * 0.5, y + cellH * 0.4, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(x + cellW * 0.45, y + cellH * 0.4, 4, 14);
          } else if (grid[r][c] === 5) {
            // Stairs Down
            ctx.fillStyle = '#10b981';
            ctx.fillRect(x + 4, y + 4, cellW - 8, cellH - 8);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText('EXIT', x + 6, y + cellH * 0.55);
          }
        }
      }

      // Render Monsters
      for (const m of monsters) {
        const mx = (m.c + 0.5) * cellW;
        const my = (m.r + 0.5) * cellH;

        ctx.fillStyle = '#9333ea';
        ctx.beginPath();
        ctx.arc(mx, my, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(mx - 4, my - 3, 2, 2);
        ctx.fillRect(mx + 2, my - 3, 2, 2);
      }

      // Render Player Knight
      const px = (pC + 0.5) * cellW;
      const py = (pR + 0.5) * cellH;

      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(px, py, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Sword
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(px + 10, py - 4);
      ctx.lineTo(px + 22, py - 16);
      ctx.stroke();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      ro.disconnect();
    };
  }, [level, isPaused, gameOver, gameWon]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[460px] bg-slate-950 select-none overflow-hidden flex flex-col">
      <canvas ref={canvasRef} className="w-full h-full flex-1 block" />

      {/* Top HUD */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none text-white font-mono text-xs">
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow">
          <span className="text-cyan-400 font-bold">CRYPT {level} / 30</span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400 font-bold">💰 {gold} GOLD</span>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow">
          <span className="text-slate-300">HP: {hp}%</span>
          <span className="text-slate-600">|</span>
          <span className={hasKey ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
            🔑 {hasKey ? 'KEY FOUND' : 'KEY REQUIRED'}
          </span>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none text-slate-400 text-xs bg-slate-900/70 px-4 py-1.5 rounded-full border border-slate-700/60">
        Use WASD or Arrows to explore rooms, defeat dungeon monsters, find the key and reach the exit
      </div>

      {gameOver && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-rose-500">FALLEN IN THE CRYPTS!</h2>
          <p className="text-slate-300 text-sm mt-2">Dungeon monsters drained your vitality.</p>
          <button
            onClick={() => {
              setGameOver(false);
              onRestart();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg"
          >
            Enter Crypt Again
          </button>
        </div>
      )}

      {gameWon && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-cyan-400">CRYPT DESCENDED!</h2>
          <p className="text-slate-300 text-sm mt-2">Key unlocked the stairway to the lower dungeons.</p>
          <button
            onClick={() => {
              setGameWon(false);
              onNextLevel();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm shadow-lg"
          >
            Next Crypt Room (Room {Math.min(30, level + 1)})
          </button>
        </div>
      )}
    </div>
  );
};
