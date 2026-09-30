import React, { useRef, useEffect, useState } from 'react';
import { ActiveGameContext } from '../types';
import { sound } from '../utils/audio';

export const BioHazard: React.FC<ActiveGameContext> = ({
  level,
  isPaused,
  onNextLevel,
  onRestart,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [health, setHealth] = useState(100);
  const [ammo, setAmmo] = useState(30);
  const [zombiesLeft, setZombiesLeft] = useState(15 + level * 5);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  const touchMoveRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchAimShootRef = useRef<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let pX = 0.5;
    let pY = 0.5;
    let pAngle = 0;
    let pHp = 100;
    let pAmmo = 30;

    const totalZombiesInRound = 15 + level * 5;
    let spawnedZombies = 0;
    let spawnTimer = 0;

    interface Bullet {
      x: number;
      y: number;
      vx: number;
      vy: number;
    }
    const bullets: Bullet[] = [];

    interface Zombie {
      x: number;
      y: number;
      hp: number;
      speed: number;
      radius: number;
    }
    const zombies: Zombie[] = [];

    // Aim target
    let aimX = 0.5;
    let aimY = 0.5;

    const shootBullet = () => {
      if (pAmmo <= 0) {
        sound.playTone(200, 'square', 0.05); // empty click
        return;
      }
      pAmmo--;
      setAmmo(pAmmo);
      sound.playLaser();

      const speed = 1.2;
      bullets.push({
        x: pX,
        y: pY,
        vx: Math.cos(pAngle) * speed,
        vy: Math.sin(pAngle) * speed,
      });
    };

    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS', 'Space', 'KeyR'].includes(e.code)) {
        e.preventDefault();
      }
      keys[e.code] = true;

      if (e.code === 'KeyR') {
        pAmmo = 30; // reload
        setAmmo(30);
        sound.playTone(600, 'sine', 0.08);
      }
      if (e.code === 'Space') shootBullet();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      aimX = (e.clientX - rect.left) / rect.width;
      aimY = (e.clientY - rect.top) / rect.height;
      pAngle = Math.atan2(aimY - pY, aimX - pX);
    };

    const handleMouseDown = () => {
      shootBullet();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);

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
        if (touchAimShootRef.current) {
          touchAimShootRef.current = false;
          shootBullet();
        }

        // Player Movement
        let dx = 0;
        let dy = 0;
        if (keys['ArrowLeft'] || keys['KeyA']) dx -= 1;
        if (keys['ArrowRight'] || keys['KeyD']) dx += 1;
        if (keys['ArrowUp'] || keys['KeyW']) dy -= 1;
        if (keys['ArrowDown'] || keys['KeyS']) dy += 1;

        if (touchMoveRef.current.x !== 0) dx = touchMoveRef.current.x;
        if (touchMoveRef.current.y !== 0) dy = touchMoveRef.current.y;

        const moveSpeed = 0.35 * dt;
        pX += dx * moveSpeed;
        pY += dy * moveSpeed;
        pX = Math.max(0.05, Math.min(0.95, pX));
        pY = Math.max(0.05, Math.min(0.95, pY));

        // Spawning Zombies
        spawnTimer -= dt;
        if (spawnTimer <= 0 && spawnedZombies < totalZombiesInRound) {
          spawnTimer = 1.0 - Math.min(0.65, level * 0.025);
          spawnedZombies++;

          // Spawn along perimeter
          const edge = Math.floor(Math.random() * 4);
          let zx = 0;
          let zy = 0;
          if (edge === 0) { zx = Math.random(); zy = -0.05; }
          else if (edge === 1) { zx = 1.05; zy = Math.random(); }
          else if (edge === 2) { zx = Math.random(); zy = 1.05; }
          else { zx = -0.05; zy = Math.random(); }

          zombies.push({
            x: zx,
            y: zy,
            hp: 2,
            speed: 0.14 + Math.random() * 0.05,
            radius: 12,
          });
        }

        // Update Bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i];
          b.x += b.vx * dt;
          b.y += b.vy * dt;

          // Check hit zombie
          for (let z = zombies.length - 1; z >= 0; z--) {
            const zb = zombies[z];
            if (Math.hypot((b.x - zb.x) * w, (b.y - zb.y) * h) < zb.radius + 6) {
              bullets.splice(i, 1);
              zb.hp -= 1;
              if (zb.hp <= 0) {
                zombies.splice(z, 1);
                sound.playWhack();
              } else {
                sound.playTone(300, 'triangle', 0.04);
              }
              break;
            }
          }

          if (b.x < -0.1 || b.x > 1.1 || b.y < -0.1 || b.y > 1.1) {
            bullets.splice(i, 1);
          }
        }

        // Update Zombies
        for (let z = zombies.length - 1; z >= 0; z--) {
          const zb = zombies[z];
          const angle = Math.atan2(pY - zb.y, pX - zb.x);
          zb.x += Math.cos(angle) * zb.speed * dt;
          zb.y += Math.sin(angle) * zb.speed * dt;

          // Attack player
          const distToPlayer = Math.hypot((pX - zb.x) * w, (pY - zb.y) * h);
          if (distToPlayer < 24) {
            pHp -= 18 * dt;
            setHealth(Math.max(0, Math.floor(pHp)));
            if (Math.random() < 0.1) sound.playHit();

            if (pHp <= 0) {
              sound.playExplosion();
              setGameOver(true);
              return;
            }
          }
        }

        const remaining = (totalZombiesInRound - spawnedZombies) + zombies.length;
        setZombiesLeft(remaining);

        if (spawnedZombies >= totalZombiesInRound && zombies.length === 0) {
          sound.playWin();
          setGameWon(true);
          return;
        }
      }

      // RENDER
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // Floor tiles
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Bullets
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 6;
      for (const b of bullets) {
        ctx.beginPath();
        ctx.arc(b.x * w, b.y * h, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Zombies
      for (const zb of zombies) {
        const zx = zb.x * w;
        const zy = zb.y * h;

        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.arc(zx, zy, zb.radius, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(zx - 3, zy - 3, 2, 2);
        ctx.fillRect(zx + 2, zy - 3, 2, 2);
      }

      // Player Survivor
      const px = pX * w;
      const py = pY * h;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(pAngle);

      // Flashlight cone
      const cone = ctx.createRadialGradient(0, 0, 10, 80, 0, 140);
      cone.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
      cone.addColorStop(1, 'transparent');
      ctx.fillStyle = cone;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 140, -Math.PI * 0.15, Math.PI * 0.15);
      ctx.closePath();
      ctx.fill();

      // Gun barrel
      ctx.fillStyle = '#334155';
      ctx.fillRect(8, -2, 14, 4);

      // Survivor body
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      ro.disconnect();
    };
  }, [level, isPaused, gameOver, gameWon]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[460px] bg-slate-950 select-none overflow-hidden flex flex-col">
      <canvas ref={canvasRef} className="w-full h-full flex-1 block cursor-crosshair" />

      {/* Top HUD */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none text-white font-mono text-xs">
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow">
          <span className="text-cyan-400 font-bold">ROUND {level} / 20</span>
          <span className="text-slate-600">|</span>
          <span className="text-rose-400 font-bold">ZOMBIES: {zombiesLeft}</span>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow">
          <span className="text-slate-300">HP:</span>
          <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all ${health > 30 ? 'bg-cyan-400' : 'bg-rose-500'}`}
              style={{ width: `${health}%` }}
            />
          </div>
          <span className="text-amber-400 font-bold">AMMO: {ammo} / 30 [R]</span>
        </div>
      </div>

      {/* Mobile shoot button */}
      <div className="absolute bottom-4 right-4 pointer-events-auto sm:hidden">
        <button
          onTouchStart={() => (touchAimShootRef.current = true)}
          className="w-18 h-18 rounded-2xl bg-rose-600 active:scale-95 text-white font-black text-xs flex items-center justify-center border border-rose-400 shadow-lg"
        >
          FIRE GUN
        </button>
      </div>

      {gameOver && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-rose-500">SURVIVOR DOWN!</h2>
          <p className="text-slate-300 text-sm mt-2">The crimson swarm breached the compound.</p>
          <button
            onClick={() => {
              setGameOver(false);
              onRestart();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg"
          >
            Retry Round
          </button>
        </div>
      )}

      {gameWon && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-cyan-400">ROUND SURVIVED!</h2>
          <p className="text-slate-300 text-sm mt-2">Perimeter cleared of all mutant hostiles.</p>
          <button
            onClick={() => {
              setGameWon(false);
              onNextLevel();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm shadow-lg"
          >
            Next Round (Round {Math.min(20, level + 1)})
          </button>
        </div>
      )}
    </div>
  );
};
