import React, { useRef, useEffect, useState } from 'react';
import { ActiveGameContext } from '../types';
import { sound } from '../utils/audio';

export const CrystalSpire: React.FC<ActiveGameContext> = ({
  level,
  isPaused,
  onNextLevel,
  onRestart,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [gold, setGold] = useState(250);
  const [baseHp, setBaseHp] = useState(20);
  const [wave, setWave] = useState(level);
  const [selectedTowerType, setSelectedTowerType] = useState<'plasma' | 'cryo' | 'laser' | 'tesla'>('plasma');
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  // Expose state to canvas loop via refs
  const goldRef = useRef(250);
  const selectedTypeRef = useRef<'plasma' | 'cryo' | 'laser' | 'tesla'>('plasma');
  selectedTypeRef.current = selectedTowerType;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let currentGold = 250 + level * 50;
    goldRef.current = currentGold;
    setGold(currentGold);
    let hp = 20;

    // Waypoints for path
    const waypoints = [
      { x: 0.0, y: 0.25 },
      { x: 0.35, y: 0.25 },
      { x: 0.35, y: 0.72 },
      { x: 0.72, y: 0.72 },
      { x: 0.72, y: 0.32 },
      { x: 1.0, y: 0.32 },
    ];

    interface Creep {
      id: number;
      x: number;
      y: number;
      wpIndex: number;
      speed: number;
      hp: number;
      maxHp: number;
      bounty: number;
      color: string;
      radius: number;
      slowTimer: number;
    }

    interface Tower {
      x: number;
      y: number;
      type: 'plasma' | 'cryo' | 'laser' | 'tesla';
      range: number;
      damage: number;
      cooldown: number;
      rate: number;
      level: number;
    }

    const towers: Tower[] = [];
    const creeps: Creep[] = [];

    // Wave spawning
    const totalCreepsInWave = 12 + level * 3;
    let creepsSpawned = 0;
    let spawnTimer = 0;

    // Placement spots (grid or click anywhere near path)
    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) / rect.width;
      const clickY = (e.clientY - rect.top) / rect.height;

      // Check distance to path (cannot build directly on path)
      let onPath = false;
      for (let i = 0; i < waypoints.length - 1; i++) {
        const p1 = waypoints[i];
        const p2 = waypoints[i + 1];
        // Line segment distance
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.hypot(dx, dy);
        const t = Math.max(0, Math.min(1, ((clickX - p1.x) * dx + (clickY - p1.y) * dy) / (len * len)));
        const projX = p1.x + t * dx;
        const projY = p1.y + t * dy;
        if (Math.hypot(clickX - projX, clickY - projY) < 0.07) {
          onPath = true;
          break;
        }
      }

      if (onPath) return;

      const costs: Record<string, number> = { plasma: 100, cryo: 140, laser: 180, tesla: 220 };
      const cost = costs[selectedTypeRef.current];

      if (goldRef.current >= cost) {
        // Build tower
        const ranges: Record<string, number> = { plasma: 0.22, cryo: 0.18, laser: 0.28, tesla: 0.24 };
        const rates: Record<string, number> = { plasma: 0.35, cryo: 1.0, laser: 0.1, tesla: 0.8 };
        const damages: Record<string, number> = { plasma: 25, cryo: 10, laser: 6, tesla: 45 };

        towers.push({
          x: clickX,
          y: clickY,
          type: selectedTypeRef.current,
          range: ranges[selectedTypeRef.current],
          damage: damages[selectedTypeRef.current],
          cooldown: 0,
          rate: rates[selectedTypeRef.current],
          level: 1,
        });

        currentGold -= cost;
        goldRef.current = currentGold;
        setGold(currentGold);
        sound.playTone(550, 'triangle', 0.08);
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

      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);

      if (!isPaused && !gameOver && !gameWon) {
        // Spawn Creeps
        spawnTimer -= dt;
        if (spawnTimer <= 0 && creepsSpawned < totalCreepsInWave) {
          spawnTimer = 1.2 - Math.min(0.6, level * 0.02);
          creepsSpawned++;

          const isBoss = creepsSpawned === totalCreepsInWave && level % 2 === 0;
          const creepHp = isBoss ? (150 + level * 60) : (40 + level * 15);
          creeps.push({
            id: creepsSpawned,
            x: waypoints[0].x,
            y: waypoints[0].y,
            wpIndex: 1,
            speed: isBoss ? 0.07 : 0.12 + Math.random() * 0.03,
            hp: creepHp,
            maxHp: creepHp,
            bounty: isBoss ? 80 : 18,
            color: isBoss ? '#ec4899' : '#06b6d4',
            radius: isBoss ? 16 : 9,
            slowTimer: 0,
          });
        }

        // Update Creeps
        for (let i = creeps.length - 1; i >= 0; i--) {
          const c = creeps[i];
          if (c.slowTimer > 0) {
            c.slowTimer -= dt;
          }
          const actualSpeed = c.slowTimer > 0 ? c.speed * 0.55 : c.speed;

          const targetWp = waypoints[c.wpIndex];
          if (!targetWp) {
            // Reached base
            hp -= 1;
            setBaseHp(hp);
            sound.playHit();
            creeps.splice(i, 1);
            if (hp <= 0) {
              setGameOver(true);
              return;
            }
            continue;
          }

          const dx = targetWp.x - c.x;
          const dy = targetWp.y - c.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 0.02) {
            c.wpIndex++;
          } else {
            c.x += (dx / dist) * actualSpeed * dt;
            c.y += (dy / dist) * actualSpeed * dt;
          }
        }

        // Update Towers & Attacks
        for (const t of towers) {
          t.cooldown -= dt;
          if (t.cooldown <= 0) {
            // Find target in range
            const inRange = creeps.filter((c) => Math.hypot(c.x - t.x, c.y - t.y) <= t.range);
            if (inRange.length > 0) {
              t.cooldown = t.rate;
              const target = inRange[0];

              if (t.type === 'plasma') {
                target.hp -= t.damage;
                sound.playTone(800, 'square', 0.05);
              } else if (t.type === 'cryo') {
                for (const c of inRange) {
                  c.hp -= t.damage;
                  c.slowTimer = 2.0;
                }
                sound.playTone(350, 'sine', 0.08);
              } else if (t.type === 'laser') {
                target.hp -= t.damage;
                sound.playTone(950, 'sawtooth', 0.04);
              } else if (t.type === 'tesla') {
                for (let k = 0; k < Math.min(3, inRange.length); k++) {
                  inRange[k].hp -= t.damage;
                }
                sound.playLaser();
              }

              // Check creep deaths
              for (let k = creeps.length - 1; k >= 0; k--) {
                if (creeps[k].hp <= 0) {
                  currentGold += creeps[k].bounty;
                  goldRef.current = currentGold;
                  setGold(currentGold);
                  sound.playCoin();
                  creeps.splice(k, 1);
                }
              }
            }
          }
        }

        // Win check
        if (creepsSpawned >= totalCreepsInWave && creeps.length === 0) {
          sound.playWin();
          setGameWon(true);
          return;
        }
      }

      // RENDER
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // Draw Path
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 36;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(waypoints[0].x * w, waypoints[0].y * h);
      for (let i = 1; i < waypoints.length; i++) {
        ctx.lineTo(waypoints[i].x * w, waypoints[i].y * h);
      }
      ctx.stroke();

      // Path inner track
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 26;
      ctx.stroke();

      // Base Crystal at path end
      const endPt = waypoints[waypoints.length - 1];
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(endPt.x * w, endPt.y * h, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Towers
      for (const t of towers) {
        const tx = t.x * w;
        const ty = t.y * h;

        // Range circle on hover/subtle
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(tx, ty, t.range * Math.min(w, h), 0, Math.PI * 2);
        ctx.stroke();

        // Tower pedestal
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(tx, ty, 16, 0, Math.PI * 2);
        ctx.fill();

        // Tower spire gem
        const tColor =
          t.type === 'plasma'
            ? '#f43f5e'
            : t.type === 'cryo'
            ? '#38bdf8'
            : t.type === 'laser'
            ? '#10b981'
            : '#eab308';

        ctx.fillStyle = tColor;
        ctx.shadowColor = tColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(tx, ty, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw Creeps
      for (const c of creeps) {
        const cx = c.x * w;
        const cy = c.y * h;

        ctx.fillStyle = c.color;
        ctx.shadowColor = c.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(cx, cy, c.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Health bar
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(cx - 12, cy - c.radius - 8, 24, 3);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(cx - 12, cy - c.radius - 8, 24 * (c.hp / c.maxHp), 3);
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
          <span className="text-cyan-400 font-bold">WAVE {level} / 30</span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400 font-bold">💰 {gold} CRYSTALS</span>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow">
          <span className="text-rose-400 font-bold">BASE HP: {baseHp} / 20</span>
        </div>
      </div>

      {/* Tower selector toolbar at bottom */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl border border-slate-700/80 shadow-xl pointer-events-auto">
        <button
          onClick={() => setSelectedTowerType('plasma')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            selectedTowerType === 'plasma'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <span className="w-3 h-3 rounded-full bg-rose-400" />
          <span>Plasma (100)</span>
        </button>

        <button
          onClick={() => setSelectedTowerType('cryo')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            selectedTowerType === 'cryo'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 font-bold'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <span className="w-3 h-3 rounded-full bg-cyan-300" />
          <span>Cryo (140)</span>
        </button>

        <button
          onClick={() => setSelectedTowerType('laser')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            selectedTowerType === 'laser'
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <span className="w-3 h-3 rounded-full bg-emerald-400" />
          <span>Laser (180)</span>
        </button>

        <button
          onClick={() => setSelectedTowerType('tesla')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            selectedTowerType === 'tesla'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 font-bold'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <span className="w-3 h-3 rounded-full bg-amber-400" />
          <span>Tesla (220)</span>
        </button>
      </div>

      {gameOver && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-rose-500">CRYSTAL SHATTERED!</h2>
          <p className="text-slate-300 text-sm mt-2">Enemy creeps overwhelmed the defensive barrier.</p>
          <button
            onClick={() => {
              setGameOver(false);
              onRestart();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg"
          >
            Retry Wave
          </button>
        </div>
      )}

      {gameWon && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-cyan-400">WAVE CLEARED!</h2>
          <p className="text-slate-300 text-sm mt-2">Crystal Spire defended successfully.</p>
          <button
            onClick={() => {
              setGameWon(false);
              onNextLevel();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm shadow-lg"
          >
            Next Wave (Wave {Math.min(30, level + 1)})
          </button>
        </div>
      )}
    </div>
  );
};
