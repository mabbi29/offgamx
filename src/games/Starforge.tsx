import React, { useRef, useEffect, useState } from 'react';
import { ActiveGameContext } from '../types';
import { sound } from '../utils/audio';

export const Starforge: React.FC<ActiveGameContext> = ({
  level,
  isPaused,
  onNextLevel,
  onRestart,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [score, setScore] = useState(0);
  const [shield, setShield] = useState(100);
  const [enemiesRemaining, setEnemiesRemaining] = useState(15 + level * 5);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let playerX = 0.5;
    let playerY = 0.85;
    let playerShield = 100;
    let currentScore = 0;
    let totalToSpawn = 15 + level * 5;
    let spawnedCount = 0;
    let weaponSpread = 1; // 1 = dual, 2 = spread 3, 3 = spread 5

    // Stars
    interface Star {
      x: number;
      y: number;
      speed: number;
      size: number;
      color: string;
    }
    const stars: Star[] = [];
    for (let i = 0; i < 80; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        speed: 0.1 + Math.random() * 0.4,
        size: 1 + Math.random() * 2,
        color: Math.random() < 0.3 ? '#67e8f9' : '#ffffff',
      });
    }

    interface Bullet {
      x: number;
      y: number;
      vx: number;
      vy: number;
      isEnemy?: boolean;
    }
    const bullets: Bullet[] = [];

    interface Enemy {
      x: number;
      y: number;
      vx: number;
      vy: number;
      hp: number;
      maxHp: number;
      isBoss?: boolean;
      color: string;
      shootTimer: number;
    }
    const enemies: Enemy[] = [];

    // Particle explosions
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      life: number;
    }
    const particles: Particle[] = [];

    let shootCooldown = 0;

    // Keys
    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyA', 'KeyD', 'KeyW', 'KeyS'].includes(e.code)) {
        e.preventDefault();
      }
      keys[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    // Pointer / touch
    let pointerTarget: { x: number; y: number } | null = null;
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      pointerTarget = {
        x: (clientX - rect.left) / rect.width,
        y: (clientY - rect.top) / rect.height,
      };
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handlePointerMove);
    canvas.addEventListener('touchmove', handlePointerMove);

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
    let spawnTimer = 0;

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);

      if (!isPaused && !gameOver && !gameWon) {
        // Starfield scrolling
        for (const s of stars) {
          s.y += s.speed * dt;
          if (s.y > 1) s.y = 0;
        }

        // Player Movement
        const speed = 0.6 * dt;
        if (keys['ArrowLeft'] || keys['KeyA']) playerX -= speed;
        if (keys['ArrowRight'] || keys['KeyD']) playerX += speed;
        if (keys['ArrowUp'] || keys['KeyW']) playerY -= speed;
        if (keys['ArrowDown'] || keys['KeyS']) playerY += speed;

        if (pointerTarget) {
          playerX += (pointerTarget.x - playerX) * dt * 8;
          playerY += (pointerTarget.y - playerY) * dt * 8;
        }

        playerX = Math.max(0.05, Math.min(0.95, playerX));
        playerY = Math.max(0.1, Math.min(0.92, playerY));

        // Player auto-fire / Space fire
        shootCooldown -= dt;
        if (shootCooldown <= 0) {
          shootCooldown = 0.14;
          sound.playLaser();
          if (weaponSpread === 1) {
            bullets.push({ x: playerX - 0.02, y: playerY - 0.04, vx: 0, vy: -1.2 });
            bullets.push({ x: playerX + 0.02, y: playerY - 0.04, vx: 0, vy: -1.2 });
          } else {
            bullets.push({ x: playerX - 0.02, y: playerY - 0.04, vx: -0.15, vy: -1.2 });
            bullets.push({ x: playerX, y: playerY - 0.05, vx: 0, vy: -1.2 });
            bullets.push({ x: playerX + 0.02, y: playerY - 0.04, vx: 0.15, vy: -1.2 });
          }
        }

        // Enemy Spawning
        spawnTimer -= dt;
        if (spawnTimer <= 0 && spawnedCount < totalToSpawn) {
          spawnTimer = 1.0 - Math.min(0.6, level * 0.02);
          spawnedCount++;
          const isBoss = spawnedCount === totalToSpawn && level % 3 === 0;

          enemies.push({
            x: 0.1 + Math.random() * 0.8,
            y: -0.05,
            vx: (Math.random() - 0.5) * 0.3,
            vy: isBoss ? 0.08 : 0.18 + Math.random() * 0.12,
            hp: isBoss ? 25 : 2,
            maxHp: isBoss ? 25 : 2,
            isBoss,
            color: isBoss ? '#ec4899' : '#f59e0b',
            shootTimer: 1.0 + Math.random(),
          });
        }

        // Update Bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i];
          b.x += b.vx * dt;
          b.y += b.vy * dt;

          if (b.isEnemy) {
            // Check hit player
            const dist = Math.hypot(b.x - playerX, b.y - playerY);
            if (dist < 0.04) {
              bullets.splice(i, 1);
              playerShield -= 15;
              sound.playHit();
              setShield(Math.max(0, playerShield));
              if (playerShield <= 0) {
                sound.playExplosion();
                setGameOver(true);
                return;
              }
              continue;
            }
          } else {
            // Check hit enemies
            for (let e = enemies.length - 1; e >= 0; e--) {
              const en = enemies[e];
              const enDist = Math.hypot(b.x - en.x, b.y - en.y);
              const hitRadius = en.isBoss ? 0.08 : 0.04;

              if (enDist < hitRadius) {
                bullets.splice(i, 1);
                en.hp--;
                // Spawn sparks
                for (let p = 0; p < 4; p++) {
                  particles.push({
                    x: b.x,
                    y: b.y,
                    vx: (Math.random() - 0.5) * 0.4,
                    vy: (Math.random() - 0.5) * 0.4,
                    color: '#fde047',
                    life: 0.3,
                  });
                }

                if (en.hp <= 0) {
                  sound.playExplosion();
                  currentScore += en.isBoss ? 1500 : 120;
                  setScore(currentScore);

                  // Explosion cloud
                  for (let p = 0; p < 16; p++) {
                    particles.push({
                      x: en.x,
                      y: en.y,
                      vx: (Math.random() - 0.5) * 0.6,
                      vy: (Math.random() - 0.5) * 0.6,
                      color: en.color,
                      life: 0.6,
                    });
                  }
                  enemies.splice(e, 1);
                } else {
                  sound.playTone(320, 'square', 0.04);
                }
                break;
              }
            }
          }

          if (b.y < -0.05 || b.y > 1.05 || b.x < -0.05 || b.x > 1.05) {
            bullets.splice(i, 1);
          }
        }

        // Update Enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
          const en = enemies[i];
          en.x += en.vx * dt;
          en.y += en.vy * dt;

          if (en.x < 0.05 || en.x > 0.95) en.vx *= -1;

          en.shootTimer -= dt;
          if (en.shootTimer <= 0) {
            en.shootTimer = 1.8 + Math.random();
            bullets.push({
              x: en.x,
              y: en.y + 0.04,
              vx: (playerX - en.x) * 0.4,
              vy: 0.5,
              isEnemy: true,
            });
          }

          // Crash into player
          if (Math.hypot(en.x - playerX, en.y - playerY) < 0.06) {
            sound.playExplosion();
            playerShield -= 30;
            setShield(Math.max(0, playerShield));
            enemies.splice(i, 1);
            if (playerShield <= 0) {
              setGameOver(true);
              return;
            }
          }

          if (en.y > 1.05) enemies.splice(i, 1);
        }

        // Update Particles
        for (let p = particles.length - 1; p >= 0; p--) {
          const part = particles[p];
          part.x += part.vx * dt;
          part.y += part.vy * dt;
          part.life -= dt;
          if (part.life <= 0) particles.splice(p, 1);
        }

        const remaining = (totalToSpawn - spawnedCount) + enemies.length;
        setEnemiesRemaining(remaining);

        // Win condition
        if (spawnedCount >= totalToSpawn && enemies.length === 0) {
          sound.playWin();
          setGameWon(true);
          return;
        }
      }

      // RENDER
      ctx.fillStyle = '#050814';
      ctx.fillRect(0, 0, w, h);

      // Nebula glow
      const nebGrad = ctx.createRadialGradient(w * 0.7, h * 0.3, 20, w * 0.7, h * 0.3, w * 0.5);
      nebGrad.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
      nebGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.08)');
      nebGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = nebGrad;
      ctx.fillRect(0, 0, w, h);

      // Stars
      for (const s of stars) {
        ctx.fillStyle = s.color;
        ctx.fillRect(s.x * w, s.y * h, s.size, s.size);
      }

      // Bullets
      for (const b of bullets) {
        ctx.fillStyle = b.isEnemy ? '#f43f5e' : '#38bdf8';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(b.x * w, b.y * h, b.isEnemy ? 4 : 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Particles
      for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x * w, p.y * h, 3, 3);
      }

      // Enemies
      for (const en of enemies) {
        const ex = en.x * w;
        const ey = en.y * h;
        const rad = en.isBoss ? 32 : 16;

        ctx.fillStyle = en.color;
        ctx.shadowColor = en.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(ex, ey + rad);
        ctx.lineTo(ex - rad, ey - rad);
        ctx.lineTo(ex, ey - rad * 0.4);
        ctx.lineTo(ex + rad, ey - rad);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Health bar for boss
        if (en.isBoss) {
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(ex - 30, ey - rad - 12, 60, 4);
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(ex - 30, ey - rad - 12, 60 * (en.hp / en.maxHp), 4);
        }
      }

      // Player Starship
      const px = playerX * w;
      const py = playerY * h;
      const pSize = 22;

      // Engine Thruster glow
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(px - 6, py + pSize * 0.7);
      ctx.lineTo(px, py + pSize * 0.7 + 10 + Math.random() * 8);
      ctx.lineTo(px + 6, py + pSize * 0.7);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Starship body
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(px, py - pSize);
      ctx.lineTo(px - pSize * 0.8, py + pSize * 0.7);
      ctx.lineTo(px, py + pSize * 0.3);
      ctx.lineTo(px + pSize * 0.8, py + pSize * 0.7);
      ctx.closePath();
      ctx.fill();

      // Wing lasers
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(px - pSize * 0.8 - 2, py + pSize * 0.2, 4, 12);
      ctx.fillRect(px + pSize * 0.8 - 2, py + pSize * 0.2, 4, 12);

      // Cockpit
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(px, py - pSize * 0.2, 4, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handlePointerMove);
      canvas.removeEventListener('touchmove', handlePointerMove);
      ro.disconnect();
    };
  }, [level, isPaused, gameOver, gameWon]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[460px] bg-slate-950 select-none overflow-hidden flex flex-col">
      <canvas ref={canvasRef} className="w-full h-full flex-1 block cursor-crosshair" />

      {/* In-Game HUD overlay */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none text-white font-mono text-xs">
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow">
          <span className="text-cyan-400 font-bold">LEVEL {level} / 30</span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400 font-bold">SCORE: {score}</span>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow">
          <span className="text-slate-400">SHIELD:</span>
          <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all ${
                shield > 30 ? 'bg-cyan-400' : 'bg-rose-500'
              }`}
              style={{ width: `${shield}%` }}
            />
          </div>
          <span className="text-slate-400">ENEMIES: {enemiesRemaining}</span>
        </div>
      </div>

      {gameOver && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-rose-500">SHIP DESTROYED!</h2>
          <p className="text-slate-300 text-sm mt-2">Shields depleted in the asteroid void.</p>
          <button
            onClick={() => {
              setGameOver(false);
              onRestart();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg"
          >
            Deploy Again
          </button>
        </div>
      )}

      {gameWon && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-cyan-400">SECTOR SECURED!</h2>
          <p className="text-slate-300 text-sm mt-2">Void vanguard neutralized. Score: {score}</p>
          <button
            onClick={() => {
              setGameWon(false);
              onNextLevel();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm shadow-lg"
          >
            Next Sector (Level {Math.min(30, level + 1)})
          </button>
        </div>
      )}
    </div>
  );
};
