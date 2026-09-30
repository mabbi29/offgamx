import React, { useRef, useEffect, useState } from 'react';
import { ActiveGameContext } from '../types';
import { sound } from '../utils/audio';

export const CyberStriker: React.FC<ActiveGameContext> = ({
  level,
  isPaused,
  onNextLevel,
  onRestart,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [playerHp, setPlayerHp] = useState(100);
  const [combo, setCombo] = useState(0);
  const [enemiesRemaining, setEnemiesRemaining] = useState(3 + level);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  const touchActionRef = useRef<'punch' | 'kick' | 'special' | null>(null);
  const touchDirRef = useRef<-1 | 0 | 1>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let pX = 0.3;
    let pFacing: 1 | -1 = 1;
    let pHp = 100;
    let pAction: 'idle' | 'walk' | 'punch' | 'kick' | 'special' = 'idle';
    let actionTimer = 0;
    let comboCount = 0;

    interface Enemy {
      id: number;
      x: number;
      hp: number;
      maxHp: number;
      isBoss?: boolean;
      attackTimer: number;
      hitStun: number;
    }

    const totalEnemies = 3 + level;
    const enemies: Enemy[] = [];
    for (let i = 0; i < totalEnemies; i++) {
      const isBoss = i === totalEnemies - 1 && level % 4 === 0;
      enemies.push({
        id: i,
        x: 0.85 + i * 0.3,
        hp: isBoss ? 200 : 50 + level * 10,
        maxHp: isBoss ? 200 : 50 + level * 10,
        isBoss,
        attackTimer: 1.0 + Math.random(),
        hitStun: 0,
      });
    }

    const keys: Record<string, boolean> = {};

    const triggerAttack = (type: 'punch' | 'kick' | 'special') => {
      if (actionTimer > 0) return;
      pAction = type;
      actionTimer = type === 'special' ? 0.35 : 0.22;

      if (type === 'punch') sound.playWhack();
      if (type === 'kick') sound.playHit();
      if (type === 'special') sound.playLaser();

      // Check hit against enemies in front
      const reach = type === 'special' ? 0.35 : 0.18;
      const damage = type === 'punch' ? 25 : type === 'kick' ? 40 : 80;

      let hitAny = false;
      for (const en of enemies) {
        if (en.hp <= 0) continue;
        const diff = (en.x - pX) * pFacing;
        if (diff > 0 && diff < reach) {
          hitAny = true;
          en.hp -= damage;
          en.x += pFacing * 0.05; // knockback
          en.hitStun = 0.25;

          if (en.hp <= 0) {
            sound.playExplosion();
          }
        }
      }

      if (hitAny) {
        comboCount++;
        setCombo(comboCount);
      } else {
        comboCount = 0;
        setCombo(0);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'KeyJ', 'KeyK', 'KeyL', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      keys[e.code] = true;

      if (e.code === 'KeyJ') triggerAttack('punch');
      if (e.code === 'KeyK') triggerAttack('kick');
      if (e.code === 'KeyL' || e.code === 'Space') triggerAttack('special');
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
        // Touch attacks
        if (touchActionRef.current) {
          triggerAttack(touchActionRef.current);
          touchActionRef.current = null;
        }

        if (actionTimer > 0) {
          actionTimer -= dt;
          if (actionTimer <= 0) pAction = 'idle';
        } else {
          // Movement
          let moveDir = 0;
          if (keys['ArrowLeft'] || keys['KeyA'] || touchDirRef.current === -1) moveDir -= 1;
          if (keys['ArrowRight'] || keys['KeyD'] || touchDirRef.current === 1) moveDir += 1;

          if (moveDir !== 0) {
            pAction = 'walk';
            pFacing = moveDir > 0 ? 1 : -1;
            pX += moveDir * 0.45 * dt;
            pX = Math.max(0.08, Math.min(0.92, pX));
          } else {
            pAction = 'idle';
          }
        }

        // Update Enemies
        let livingCount = 0;
        for (const en of enemies) {
          if (en.hp <= 0) continue;
          livingCount++;

          if (en.hitStun > 0) {
            en.hitStun -= dt;
            continue;
          }

          // Advance towards player
          const dist = Math.abs(en.x - pX);
          if (dist > 0.14) {
            en.x += (pX > en.x ? 1 : -1) * 0.16 * dt;
          } else {
            // Attack player
            en.attackTimer -= dt;
            if (en.attackTimer <= 0) {
              en.attackTimer = 1.2 + Math.random() * 0.5;
              pHp -= en.isBoss ? 25 : 12;
              setPlayerHp(Math.max(0, pHp));
              sound.playHit();

              if (pHp <= 0) {
                sound.playExplosion();
                setGameOver(true);
                return;
              }
            }
          }
        }

        setEnemiesRemaining(livingCount);

        if (livingCount === 0) {
          sound.playWin();
          setGameWon(true);
          return;
        }
      }

      // RENDER
      ctx.fillStyle = '#0a0d18';
      ctx.fillRect(0, 0, w, h);

      // Cyber alley background
      const groundY = h * 0.76;
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(0, groundY - 140, w, 140);

      // Floor
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, groundY, w, h - groundY);
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(0, groundY, w, 2);

      // Render Enemies
      for (const en of enemies) {
        if (en.hp <= 0) continue;
        const ex = en.x * w;
        const ey = groundY;
        const rad = en.isBoss ? 26 : 18;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(ex, ey + 4, rad, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cyborg Enemy Body
        ctx.fillStyle = en.isBoss ? '#ec4899' : '#f43f5e';
        ctx.fillRect(ex - rad * 0.5, ey - rad * 2.2, rad, rad * 2.2);

        // Enemy Head
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ex - rad * 0.35, ey - rad * 2.8, rad * 0.7, rad * 0.6);

        // HP bar above
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(ex - 20, ey - rad * 3.3, 40, 4);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(ex - 20, ey - rad * 3.3, 40 * (en.hp / en.maxHp), 4);
      }

      // Render Player Hero
      const px = pX * w;
      const py = groundY;
      const pH = 55;
      const pW = 24;

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(px, py + 4, 20, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cyber Martial Artist Body
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(px - pW * 0.5, py - pH, pW, pH);

      // Glowing cyber visor
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(px + (pFacing === 1 ? 2 : -10), py - pH + 8, 8, 4);

      // Attack animations
      if (pAction === 'punch') {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(px + pFacing * (pW * 0.5), py - pH * 0.65, pFacing * 28, 8);
      } else if (pAction === 'kick') {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(px + pFacing * (pW * 0.5), py - pH * 0.4, pFacing * 34, 10);
      } else if (pAction === 'special') {
        // Cyber Dragon energy blast wave
        ctx.fillStyle = '#06b6d4';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(px + pFacing * 40, py - pH * 0.5, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

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
          <span className="text-cyan-400 font-bold">STAGE {level} / 20</span>
          <span className="text-slate-600">|</span>
          <span className="text-rose-400 font-bold">CYBORGS: {enemiesRemaining}</span>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow">
          <span className="text-slate-400">HP:</span>
          <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all ${playerHp > 35 ? 'bg-cyan-400' : 'bg-rose-500'}`}
              style={{ width: `${playerHp}%` }}
            />
          </div>
          {combo > 1 && (
            <span className="text-amber-400 font-black animate-pulse">{combo}x COMBO!</span>
          )}
        </div>
      </div>

      {/* Mobile action bar */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-auto sm:hidden">
        <div className="flex gap-2">
          <button
            onTouchStart={() => (touchDirRef.current = -1)}
            onTouchEnd={() => (touchDirRef.current = 0)}
            className="w-12 h-12 rounded-xl bg-slate-800 text-white font-bold text-lg flex items-center justify-center"
          >
            ←
          </button>
          <button
            onTouchStart={() => (touchDirRef.current = 1)}
            onTouchEnd={() => (touchDirRef.current = 0)}
            className="w-12 h-12 rounded-xl bg-slate-800 text-white font-bold text-lg flex items-center justify-center"
          >
            →
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onTouchStart={() => (touchActionRef.current = 'punch')}
            className="w-12 h-12 rounded-xl bg-cyan-600 text-white font-bold text-xs flex items-center justify-center"
          >
            PUNCH
          </button>
          <button
            onTouchStart={() => (touchActionRef.current = 'kick')}
            className="w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center"
          >
            KICK
          </button>
          <button
            onTouchStart={() => (touchActionRef.current = 'special')}
            className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-400 to-amber-400 text-slate-950 font-black text-xs flex items-center justify-center"
          >
            DRAGON
          </button>
        </div>
      </div>

      {gameOver && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-rose-500">KNOCKED OUT!</h2>
          <p className="text-slate-300 text-sm mt-2">Chain combos to stun opposing cyborgs.</p>
          <button
            onClick={() => {
              setGameOver(false);
              onRestart();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg"
          >
            Fight Again
          </button>
        </div>
      )}

      {gameWon && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-cyan-400">STAGE CLEARED!</h2>
          <p className="text-slate-300 text-sm mt-2">All cyborg challengers defeated.</p>
          <button
            onClick={() => {
              setGameWon(false);
              onNextLevel();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm shadow-lg"
          >
            Next Stage (Stage {Math.min(20, level + 1)})
          </button>
        </div>
      )}
    </div>
  );
};
