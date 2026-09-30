import React, { useRef, useEffect, useState } from 'react';
import { ActiveGameContext } from '../types';
import { sound } from '../utils/audio';

export const ChronoPipe: React.FC<ActiveGameContext> = ({
  level,
  isPaused,
  onNextLevel,
  onRestart,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [timeLeft, setTimeLeft] = useState(60);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const rows = 6;
    const cols = 8;
    let timer = Math.max(35, 70 - level * 2);

    // Pipe directions: [Top, Right, Bottom, Left] booleans
    interface PipeTile {
      r: number;
      c: number;
      type: 'straight' | 'corner' | 'tee' | 'cross';
      rotation: number; // 0, 90, 180, 270
      connected: boolean;
    }

    const grid: PipeTile[][] = [];

    // Create a guaranteed solvable route first, then scramble rotations
    for (let r = 0; r < rows; r++) {
      grid[r] = [];
      for (let c = 0; c < cols; c++) {
        // Distribute types
        const types: ('straight' | 'corner' | 'tee' | 'cross')[] = ['straight', 'corner', 'straight', 'corner', 'tee'];
        const type = types[Math.floor(Math.random() * types.length)];
        const rot = Math.floor(Math.random() * 4) * 90;
        grid[r][c] = {
          r,
          c,
          type,
          rotation: rot,
          connected: false,
        };
      }
    }

    // Set start & end
    const startTile = { r: 1, c: 0 };
    const endTile = { r: 4, c: cols - 1 };

    // Returns [top, right, bottom, left] open ports based on type & rotation
    const getPorts = (tile: PipeTile): boolean[] => {
      let basePorts = [false, false, false, false];
      if (tile.type === 'straight') basePorts = [true, false, true, false];
      if (tile.type === 'corner') basePorts = [true, true, false, false];
      if (tile.type === 'tee') basePorts = [true, true, false, true];
      if (tile.type === 'cross') basePorts = [true, true, true, true];

      // Shift by rotation / 90
      const shift = (tile.rotation / 90) % 4;
      const shifted = [false, false, false, false];
      for (let i = 0; i < 4; i++) {
        shifted[(i + shift) % 4] = basePorts[i];
      }
      return shifted;
    };

    const computeFlow = () => {
      // Reset connected state
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          grid[r][c].connected = false;
        }
      }

      // BFS from start
      const queue: { r: number; c: number }[] = [];
      grid[startTile.r][startTile.c].connected = true;
      queue.push(startTile);

      const dr = [-1, 0, 1, 0]; // Top, Right, Bottom, Left
      const dc = [0, 1, 0, -1];
      const opposite = [2, 3, 0, 1];

      while (queue.length > 0) {
        const curr = queue.shift()!;
        const ports = getPorts(grid[curr.r][curr.c]);

        for (let dir = 0; dir < 4; dir++) {
          if (ports[dir]) {
            const nr = curr.r + dr[dir];
            const nc = curr.c + dc[dir];

            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
              const neighbor = grid[nr][nc];
              if (!neighbor.connected) {
                const neighborPorts = getPorts(neighbor);
                if (neighborPorts[opposite[dir]]) {
                  neighbor.connected = true;
                  queue.push({ r: nr, c: nc });
                }
              }
            }
          }
        }
      }

      // Check if end tile connected
      if (grid[endTile.r][endTile.c].connected) {
        sound.playWin();
        setGameWon(true);
      }
    };

    computeFlow();

    // Click handler to rotate tile
    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) / rect.width;
      const clickY = (e.clientY - rect.top) / rect.height;

      const c = Math.floor(clickX * cols);
      const r = Math.floor(clickY * rows);

      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        grid[r][c].rotation = (grid[r][c].rotation + 90) % 360;
        sound.playCardFlip();
        computeFlow();
      }
    };

    canvas.addEventListener('click', handleCanvasClick);

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

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (!isPaused && !gameOver && !gameWon) {
        timer -= dt;
        setTimeLeft(Math.max(0, Math.ceil(timer)));
        if (timer <= 0) {
          sound.playHit();
          setGameOver(true);
          return;
        }
      }

      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);

      const cellW = w / cols;
      const cellH = h / rows;

      // Dark industrial floor
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // Draw Grid & Pipes
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const tile = grid[r][c];
          const x = c * cellW;
          const y = r * cellH;
          const cx = x + cellW * 0.5;
          const cy = y + cellH * 0.5;
          const pipeThick = Math.min(cellW, cellH) * 0.28;

          // Tile boundary
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);
          ctx.strokeStyle = '#334155';
          ctx.strokeRect(x + 2, y + 2, cellW - 4, cellH - 4);

          // Pipe Color: Neon cyan if plasma connected, otherwise grey
          const pipeColor = tile.connected ? '#06b6d4' : '#64748b';
          const ports = getPorts(tile);

          ctx.fillStyle = pipeColor;
          if (tile.connected) {
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = 8;
          }

          // Center joint
          ctx.beginPath();
          ctx.arc(cx, cy, pipeThick * 0.5, 0, Math.PI * 2);
          ctx.fill();

          // Draw arms to open ports
          if (ports[0]) ctx.fillRect(cx - pipeThick * 0.5, y, pipeThick, cellH * 0.5); // Top
          if (ports[1]) ctx.fillRect(cx, cy - pipeThick * 0.5, cellW * 0.5, pipeThick); // Right
          if (ports[2]) ctx.fillRect(cx - pipeThick * 0.5, cy, pipeThick, cellH * 0.5); // Bottom
          if (ports[3]) ctx.fillRect(x, cy - pipeThick * 0.5, cellW * 0.5, pipeThick); // Left

          ctx.shadowBlur = 0;

          // Mark start & end
          if (r === startTile.r && c === startTile.c) {
            ctx.fillStyle = '#22c55e';
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText('IN', x + 6, cy + 4);
          }
          if (r === endTile.r && c === endTile.c) {
            ctx.fillStyle = '#f59e0b';
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText('OUT', x + 6, cy + 4);
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('click', handleCanvasClick);
      ro.disconnect();
    };
  }, [level, isPaused, gameOver, gameWon]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[460px] bg-slate-950 select-none overflow-hidden flex flex-col">
      <canvas ref={canvasRef} className="w-full h-full flex-1 block cursor-pointer" />

      {/* Top HUD */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none text-white font-mono text-xs">
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow">
          <span className="text-cyan-400 font-bold">LEVEL {level} / 25</span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400 font-bold">PRESSURE FLOW</span>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow">
          <span className={`${timeLeft < 15 ? 'text-rose-500 font-black' : 'text-slate-300'}`}>
            TIME: {timeLeft}s
          </span>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none text-slate-400 text-xs bg-slate-900/70 px-4 py-1.5 rounded-full border border-slate-700/60">
        Click pipe tiles to rotate 90° and connect the cyan plasma flow from IN to OUT
      </div>

      {gameOver && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-rose-500">PRESSURE BREACH!</h2>
          <p className="text-slate-300 text-sm mt-2">Time expired before fluid reached the turbine.</p>
          <button
            onClick={() => {
              setGameOver(false);
              onRestart();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg"
          >
            Retry Level
          </button>
        </div>
      )}

      {gameWon && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-cyan-400">FLOW RESTORED!</h2>
          <p className="text-slate-300 text-sm mt-2">Plasma conduits sealed with active circulation.</p>
          <button
            onClick={() => {
              setGameWon(false);
              onNextLevel();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm shadow-lg"
          >
            Next Sector (Level {Math.min(25, level + 1)})
          </button>
        </div>
      )}
    </div>
  );
};
