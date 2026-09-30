import React, { useRef, useEffect, useState } from 'react';
import { ActiveGameContext } from '../types';
import { sound } from '../utils/audio';

export const AbyssDiver: React.FC<ActiveGameContext> = ({
  level,
  isPaused,
  onNextLevel,
  onRestart,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [oxygen, setOxygen] = useState(100);
  const [artifacts, setArtifacts] = useState(0);
  const [targetArtifacts, setTargetArtifacts] = useState(3 + Math.floor(level / 6));
  const [depthMeter, setDepthMeter] = useState(200 + level * 150);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  const touchMoveRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchSonarRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let subX = 0.5;
    let subY = 0.2;
    let subVx = 0;
    let subVy = 0;
    let o2 = 100;

    let sonarWaveRadius = 0;
    let sonarActive = false;

    let collected = 0;
    const goalCount = 3 + Math.floor(level / 6);
    setTargetArtifacts(goalCount);

    // Sunken relics & Oxygen Vents
    interface Item {
      x: number;
      y: number;
      type: 'relic' | 'vent' | 'creature';
      collected?: boolean;
    }
    const items: Item[] = [];
    for (let i = 0; i < goalCount; i++) {
      items.push({
        x: 0.15 + (i * 0.7) / goalCount + Math.random() * 0.1,
        y: 0.5 + Math.random() * 0.35,
        type: 'relic',
      });
    }
    // Oxygen vents
    for (let i = 0; i < 3; i++) {
      items.push({
        x: 0.2 + Math.random() * 0.6,
        y: 0.4 + Math.random() * 0.4,
        type: 'vent',
      });
    }
    // Leviathan Deep Sea Creatures
    const numCreatures = 1 + Math.min(3, Math.floor(level / 5));
    for (let i = 0; i < numCreatures; i++) {
      items.push({
        x: 0.2 + Math.random() * 0.6,
        y: 0.6 + Math.random() * 0.25,
        type: 'creature',
      });
    }

    const fireSonar = () => {
      sonarActive = true;
      sonarWaveRadius = 10;
      sound.playSonar();
    };

    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyA', 'KeyD', 'KeyW', 'KeyS'].includes(e.code)) {
        e.preventDefault();
      }
      keys[e.code] = true;
      if (e.code === 'Space') fireSonar();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
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

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);

      if (!isPaused && !gameOver && !gameWon) {
        if (touchSonarRef.current) {
          touchSonarRef.current = false;
          fireSonar();
        }

        // Oxygen drains
        o2 -= 2.8 * dt;
        setOxygen(Math.max(0, Math.floor(o2)));
        if (o2 <= 0) {
          sound.playHit();
          setGameOver(true);
          return;
        }

        // Submarine propulsion
        let ax = 0;
        let ay = 0.05; // natural sinking gravity
        if (keys['ArrowLeft'] || keys['KeyA']) ax -= 0.8;
        if (keys['ArrowRight'] || keys['KeyD']) ax += 0.8;
        if (keys['ArrowUp'] || keys['KeyW']) ay -= 0.9;
        if (keys['ArrowDown'] || keys['KeyS']) ay += 0.8;

        if (touchMoveRef.current.x !== 0) ax = touchMoveRef.current.x * 0.8;
        if (touchMoveRef.current.y !== 0) ay += touchMoveRef.current.y * 0.8;

        subVx = (subVx + ax * dt) * 0.92;
        subVy = (subVy + ay * dt) * 0.92;

        subX += subVx * dt;
        subY += subVy * dt;

        subX = Math.max(0.06, Math.min(0.94, subX));
        subY = Math.max(0.08, Math.min(0.92, subY));

        // Sonar Wave expansion
        if (sonarActive) {
          sonarWaveRadius += 450 * dt;
          if (sonarWaveRadius > Math.max(w, h)) {
            sonarActive = false;
          }
        }

        // Check Items
        for (const it of items) {
          const dist = Math.hypot(it.x - subX, it.y - subY);
          if (dist < 0.07) {
            if (it.type === 'relic' && !it.collected) {
              it.collected = true;
              collected++;
              setArtifacts(collected);
              sound.playCoin();

              if (collected >= goalCount) {
                sound.playWin();
                setGameWon(true);
                return;
              }
            } else if (it.type === 'vent') {
              o2 = Math.min(100, o2 + 35 * dt);
            } else if (it.type === 'creature') {
              o2 -= 20 * dt;
              sound.playHit();
            }
          }
        }
      }

      // RENDER
      // Deep Abyssal darkness
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, w, h);

      // Trench Walls
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w * 0.08, h * 0.5);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(w, 0);
      ctx.lineTo(w * 0.92, h * 0.5);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // Sonar Pulse Ring
      if (sonarActive) {
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(subX * w, subY * h, sonarWaveRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Submarine Headlights Cone
      const sx = subX * w;
      const sy = subY * h;

      const lightGrad = ctx.createRadialGradient(sx, sy, 10, sx, sy + 80, 180);
      lightGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
      lightGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = lightGrad;
      ctx.beginPath();
      ctx.arc(sx, sy, 180, 0, Math.PI * 2);
      ctx.fill();

      // Render Items
      for (const it of items) {
        const ix = it.x * w;
        const iy = it.y * h;

        if (it.type === 'relic' && !it.collected) {
          // Golden Relic
          ctx.fillStyle = '#facc15';
          ctx.shadowColor = '#facc15';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(ix, iy, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (it.type === 'vent') {
          // Cyan Oxygen Bubbles
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(ix, iy, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px sans-serif';
          ctx.fillText('O2', ix - 6, iy + 3);
        } else if (it.type === 'creature') {
          // Bioluminescent Leviathan
          ctx.fillStyle = '#ec4899';
          ctx.shadowColor = '#ec4899';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.ellipse(ix, iy, 26, 10, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // Render Submarine
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(sx, sy, 24, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Conning tower
      ctx.fillRect(sx - 4, sy - 18, 8, 8);

      // Porthole
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(sx + 8, sy, 4, 0, Math.PI * 2);
      ctx.fill();

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

      {/* Top HUD */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none text-white font-mono text-xs">
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow">
          <span className="text-cyan-400 font-bold">DEPTH ZONE {level} / 20</span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400 font-bold">
            🏺 RELICS: {artifacts} / {targetArtifacts}
          </span>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow">
          <span className="text-slate-300">O2:</span>
          <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all ${oxygen > 30 ? 'bg-cyan-400' : 'bg-rose-500'}`}
              style={{ width: `${oxygen}%` }}
            />
          </div>
          <span className="text-slate-400">DEPTH: {depthMeter}m</span>
        </div>
      </div>

      {/* Mobile Sonar action button */}
      <div className="absolute bottom-4 right-4 pointer-events-auto sm:hidden">
        <button
          onTouchStart={() => (touchSonarRef.current = true)}
          className="w-18 h-18 rounded-2xl bg-cyan-600 active:scale-95 text-white font-black text-xs flex items-center justify-center border border-cyan-400 shadow-lg"
        >
          SONAR PING
        </button>
      </div>

      {gameOver && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-rose-500">OXYGEN DEPLETED!</h2>
          <p className="text-slate-300 text-sm mt-2">Surface to replenish air reserves or gather O2 vents.</p>
          <button
            onClick={() => {
              setGameOver(false);
              onRestart();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg"
          >
            Dive Again
          </button>
        </div>
      )}

      {gameWon && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-cyan-400">RELICS RECOVERED!</h2>
          <p className="text-slate-300 text-sm mt-2">Sunken abyssal artifacts brought to the surface.</p>
          <button
            onClick={() => {
              setGameWon(false);
              onNextLevel();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm shadow-lg"
          >
            Next Depth Zone (Zone {Math.min(20, level + 1)})
          </button>
        </div>
      )}
    </div>
  );
};
