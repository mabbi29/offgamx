import React, { useRef, useEffect, useState } from 'react';
import { ActiveGameContext } from '../types';
import { sound } from '../utils/audio';

export const BlastMaster: React.FC<ActiveGameContext> = ({
  level,
  isPaused,
  onNextLevel,
  onRestart,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [score, setScore] = useState(0);
  const [botsLeft, setBotsLeft] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  const touchMoveRef = useRef<{ x: number; y: number } | null>(null);
  const touchBombRef = useRef<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const rows = 11;
    const cols = 15;

    // Grid: 0 = Empty, 1 = Solid Pillar, 2 = Soft Crate
    const grid: number[][] = [];
    for (let r = 0; r < rows; r++) {
      grid[r] = [];
      for (let c = 0; c < cols; c++) {
        if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
          grid[r][c] = 1; // Outer wall
        } else if (r % 2 === 0 && c % 2 === 0) {
          grid[r][c] = 1; // Internal pillars
        } else if ((r <= 2 && c <= 2) || (r >= rows - 3 && c >= cols - 3)) {
          grid[r][c] = 0; // Spawn clear zones
        } else {
          grid[r][c] = Math.random() < 0.65 ? 2 : 0; // Destructible crates
        }
      }
    }

    let player = {
      x: 1.5,
      y: 1.5,
      speed: 3.2,
      maxBombs: 1,
      blastRange: 2,
    };

    interface Bomb {
      r: number;
      c: number;
      timer: number;
      range: number;
    }
    const bombs: Bomb[] = [];

    interface Explosion {
      r: number;
      c: number;
      timer: number;
    }
    const explosions: Explosion[] = [];

    interface Enemy {
      x: number;
      y: number;
      dir: { x: number; y: number };
      alive: boolean;
      changeTimer: number;
    }

    const enemies: Enemy[] = [];
    const numEnemies = 2 + Math.min(6, Math.floor(level * 0.8));
    for (let i = 0; i < numEnemies; i++) {
      // Spawn enemies in bottom-right quadrant
      enemies.push({
        x: cols - 2.5 - (i % 2),
        y: rows - 2.5 - Math.floor(i / 2),
        dir: { x: 0, y: 1 },
        alive: true,
        changeTimer: 0,
      });
    }
    setBotsLeft(enemies.length);

    interface PowerUp {
      r: number;
      c: number;
      type: 'range' | 'bombs' | 'speed';
    }
    const powerups: PowerUp[] = [];

    // Keys
    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyA', 'KeyD', 'KeyW', 'KeyS'].includes(e.code)) {
        e.preventDefault();
      }
      keys[e.code] = true;

      // Drop bomb
      if (e.code === 'Space') {
        dropBomb();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    const dropBomb = () => {
      const pr = Math.floor(player.y);
      const pc = Math.floor(player.x);
      // check if bomb already at tile
      if (bombs.length < player.maxBombs && !bombs.some((b) => b.r === pr && b.c === pc)) {
        bombs.push({ r: pr, c: pc, timer: 2.2, range: player.blastRange });
        sound.playTone(400, 'square', 0.08);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

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

    let lastTime = performance.now();
    let currentScore = 0;

    const canMoveTo = (x: number, y: number, radius = 0.35) => {
      const checkPoints = [
        { r: Math.floor(y - radius), c: Math.floor(x - radius) },
        { r: Math.floor(y - radius), c: Math.floor(x + radius) },
        { r: Math.floor(y + radius), c: Math.floor(x - radius) },
        { r: Math.floor(y + radius), c: Math.floor(x + radius) },
      ];
      for (const p of checkPoints) {
        if (p.r < 0 || p.r >= rows || p.c < 0 || p.c >= cols) return false;
        if (grid[p.r][p.c] !== 0) return false;
      }
      return true;
    };

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (!isPaused && !gameOver && !gameWon) {
        // Player movement
        let dx = 0;
        let dy = 0;
        if (keys['ArrowLeft'] || keys['KeyA']) dx -= 1;
        if (keys['ArrowRight'] || keys['KeyD']) dx += 1;
        if (keys['ArrowUp'] || keys['KeyW']) dy -= 1;
        if (keys['ArrowDown'] || keys['KeyS']) dy += 1;

        if (touchMoveRef.current) {
          dx = touchMoveRef.current.x;
          dy = touchMoveRef.current.y;
        }
        if (touchBombRef.current) {
          touchBombRef.current = false;
          dropBomb();
        }

        if (dx !== 0 && canMoveTo(player.x + dx * player.speed * dt, player.y)) {
          player.x += dx * player.speed * dt;
        }
        if (dy !== 0 && canMoveTo(player.x, player.y + dy * player.speed * dt)) {
          player.y += dy * player.speed * dt;
        }

        // Check powerup collection
        const pr = Math.floor(player.y);
        const pc = Math.floor(player.x);
        for (let i = powerups.length - 1; i >= 0; i--) {
          const pup = powerups[i];
          if (pup.r === pr && pup.c === pc) {
            sound.playCoin();
            if (pup.type === 'range') player.blastRange += 1;
            if (pup.type === 'bombs') player.maxBombs += 1;
            if (pup.type === 'speed') player.speed = Math.min(4.8, player.speed + 0.4);
            currentScore += 150;
            powerups.splice(i, 1);
          }
        }

        // Update bombs
        for (let b = bombs.length - 1; b >= 0; b--) {
          const bomb = bombs[b];
          bomb.timer -= dt;
          if (bomb.timer <= 0) {
            // Detonate
            sound.playExplosion();
            bombs.splice(b, 1);

            // Add center explosion
            explosions.push({ r: bomb.r, c: bomb.c, timer: 0.5 });

            // 4 cardinal directions
            const dirs = [
              { r: 0, c: 1 },
              { r: 0, c: -1 },
              { r: 1, c: 0 },
              { r: -1, c: 0 },
            ];
            for (const d of dirs) {
              for (let step = 1; step <= bomb.range; step++) {
                const tr = bomb.r + d.r * step;
                const tc = bomb.c + d.c * step;
                if (tr < 0 || tr >= rows || tc < 0 || tc >= cols) break;
                if (grid[tr][tc] === 1) break; // hits solid wall

                explosions.push({ r: tr, c: tc, timer: 0.5 });

                if (grid[tr][tc] === 2) {
                  // Destroys crate
                  grid[tr][tc] = 0;
                  currentScore += 30;
                  if (Math.random() < 0.35) {
                    const types: ('range' | 'bombs' | 'speed')[] = ['range', 'bombs', 'speed'];
                    powerups.push({ r: tr, c: tc, type: types[Math.floor(Math.random() * types.length)] });
                  }
                  break; // blast stops at crate
                }
              }
            }
          }
        }

        // Update explosions
        for (let e = explosions.length - 1; e >= 0; e--) {
          const exp = explosions[e];
          exp.timer -= dt;

          // Check player in explosion
          if (Math.floor(player.y) === exp.r && Math.floor(player.x) === exp.c) {
            sound.playHit();
            setGameOver(true);
            return;
          }

          // Check enemies in explosion
          for (const en of enemies) {
            if (en.alive && Math.floor(en.y) === exp.r && Math.floor(en.x) === exp.c) {
              en.alive = false;
              currentScore += 300;
              sound.playWhack();
            }
          }

          if (exp.timer <= 0) explosions.splice(e, 1);
        }

        // Update Enemies
        let living = 0;
        for (const en of enemies) {
          if (!en.alive) continue;
          living++;

          en.changeTimer -= dt;
          if (en.changeTimer <= 0) {
            en.changeTimer = 1.0 + Math.random();
            const dOptions = [
              { x: 1, y: 0 },
              { x: -1, y: 0 },
              { x: 0, y: 1 },
              { x: 0, y: -1 },
            ];
            en.dir = dOptions[Math.floor(Math.random() * dOptions.length)];
          }

          const nx = en.x + en.dir.x * 2.0 * dt;
          const ny = en.y + en.dir.y * 2.0 * dt;
          if (canMoveTo(nx, ny, 0.35)) {
            en.x = nx;
            en.y = ny;
          } else {
            en.changeTimer = 0;
          }

          // Enemy collision with player
          const distToPlayer = Math.hypot(player.x - en.x, player.y - en.y);
          if (distToPlayer < 0.6) {
            sound.playHit();
            setGameOver(true);
            return;
          }
        }

        setBotsLeft(living);
        setScore(currentScore);

        if (living === 0 && enemies.length > 0) {
          sound.playWin();
          setGameWon(true);
          return;
        }
      }

      // RENDER
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // Arena tile size
      const tileW = w / cols;
      const tileH = h / rows;

      // Draw Grid
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * tileW;
          const y = r * tileH;

          // Floor
          ctx.fillStyle = (r + c) % 2 === 0 ? '#1e293b' : '#334155';
          ctx.fillRect(x, y, tileW, tileH);

          if (grid[r][c] === 1) {
            // Solid Wall Pillar
            ctx.fillStyle = '#475569';
            ctx.fillRect(x + 1, y + 1, tileW - 2, tileH - 2);
            ctx.fillStyle = '#64748b';
            ctx.fillRect(x + 4, y + 4, tileW - 8, tileH - 8);
          } else if (grid[r][c] === 2) {
            // Destructible Crate
            ctx.fillStyle = '#b45309';
            ctx.fillRect(x + 2, y + 2, tileW - 4, tileH - 4);
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 4, y + 4, tileW - 8, tileH - 8);
          }
        }
      }

      // Draw Powerups
      for (const pup of powerups) {
        const px = (pup.c + 0.5) * tileW;
        const py = (pup.r + 0.5) * tileH;
        ctx.fillStyle = pup.type === 'range' ? '#f43f5e' : pup.type === 'bombs' ? '#06b6d4' : '#eab308';
        ctx.beginPath();
        ctx.arc(px, py, Math.min(tileW, tileH) * 0.28, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pup.type[0].toUpperCase(), px, py);
      }

      // Draw Bombs
      for (const b of bombs) {
        const bx = (b.c + 0.5) * tileW;
        const by = (b.r + 0.5) * tileH;
        const pulse = Math.sin(time * 0.015) * 2;

        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(bx, by, Math.min(tileW, tileH) * 0.35 + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Fuse spark
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(bx, by - Math.min(tileW, tileH) * 0.35, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Explosions
      for (const exp of explosions) {
        const ex = exp.c * tileW;
        const ey = exp.r * tileH;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.75)';
        ctx.fillRect(ex, ey, tileW, tileH);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(ex + tileW * 0.2, ey + tileH * 0.2, tileW * 0.6, tileH * 0.6);
      }

      // Draw Enemies
      for (const en of enemies) {
        if (!en.alive) continue;
        const ex = en.x * tileW;
        const ey = en.y * tileH;

        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(ex, ey, Math.min(tileW, tileH) * 0.36, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ex - 4, ey - 3, 3, 0, Math.PI * 2);
        ctx.arc(ex + 4, ey - 3, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Player Hero
      const px = player.x * tileW;
      const py = player.y * tileH;
      const pRad = Math.min(tileW, tileH) * 0.38;

      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(px, py, pRad, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Hero Visor
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px - pRad * 0.5, py - pRad * 0.4, pRad, pRad * 0.35);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      ro.disconnect();
    };
  }, [level, isPaused, gameOver, gameWon]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[460px] bg-slate-950 select-none overflow-hidden flex flex-col">
      <canvas ref={canvasRef} className="w-full h-full flex-1 block" />

      {/* HUD overlay */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none text-white font-mono text-xs">
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow">
          <span className="text-cyan-400 font-bold">LEVEL {level} / 20</span>
          <span className="text-slate-600">|</span>
          <span className="text-rose-400 font-bold">BOTS: {botsLeft}</span>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow">
          <span className="text-amber-400 font-bold">SCORE: {score}</span>
        </div>
      </div>

      {/* Touch D-Pad for mobile */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-auto sm:hidden">
        <div className="grid grid-cols-3 gap-1 w-32">
          <div />
          <button
            onTouchStart={() => (touchMoveRef.current = { x: 0, y: -1 })}
            onTouchEnd={() => (touchMoveRef.current = null)}
            className="w-10 h-10 bg-slate-800 text-white rounded-lg flex items-center justify-center font-bold"
          >
            ↑
          </button>
          <div />
          <button
            onTouchStart={() => (touchMoveRef.current = { x: -1, y: 0 })}
            onTouchEnd={() => (touchMoveRef.current = null)}
            className="w-10 h-10 bg-slate-800 text-white rounded-lg flex items-center justify-center font-bold"
          >
            ←
          </button>
          <button
            onTouchStart={() => (touchMoveRef.current = { x: 0, y: 1 })}
            onTouchEnd={() => (touchMoveRef.current = null)}
            className="w-10 h-10 bg-slate-800 text-white rounded-lg flex items-center justify-center font-bold"
          >
            ↓
          </button>
          <button
            onTouchStart={() => (touchMoveRef.current = { x: 1, y: 0 })}
            onTouchEnd={() => (touchMoveRef.current = null)}
            className="w-10 h-10 bg-slate-800 text-white rounded-lg flex items-center justify-center font-bold"
          >
            →
          </button>
        </div>

        <button
          onTouchStart={() => (touchBombRef.current = true)}
          className="w-18 h-18 rounded-2xl bg-rose-600 active:scale-95 text-white font-black text-xs flex items-center justify-center border border-rose-400 shadow-lg shadow-rose-500/30"
        >
          BOMB
        </button>
      </div>

      {gameOver && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-rose-500">BLOWN AWAY!</h2>
          <p className="text-slate-300 text-sm mt-2">Take cover from blast waves and patrol bots.</p>
          <button
            onClick={() => {
              setGameOver(false);
              onRestart();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg"
          >
            Try Again
          </button>
        </div>
      )}

      {gameWon && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-cyan-400">ARENA CLEARED!</h2>
          <p className="text-slate-300 text-sm mt-2">All bots neutralized. Sector secured!</p>
          <button
            onClick={() => {
              setGameWon(false);
              onNextLevel();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm shadow-lg"
          >
            Next Arena (Level {Math.min(20, level + 1)})
          </button>
        </div>
      )}
    </div>
  );
};
