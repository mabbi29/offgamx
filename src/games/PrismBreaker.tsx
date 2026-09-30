import React, { useRef, useEffect, useState } from 'react';
import { ActiveGameContext } from '../types';
import { sound } from '../utils/audio';

export const PrismBreaker: React.FC<ActiveGameContext> = ({
  level,
  isPaused,
  onNextLevel,
  onRestart,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let paddleX = 0.5; // normalized 0 to 1
    let paddleW = 0.18; // normalized width
    let currentScore = 0;
    let currentLives = 3;

    // Laser powerup state
    let laserTimer = 0;
    interface Laser {
      x: number;
      y: number;
    }
    let lasers: Laser[] = [];

    interface Ball {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }

    let balls: Ball[] = [
      { x: 0.5, y: 0.8, vx: 0.0035, vy: -0.0055, radius: 8 },
    ];

    interface Brick {
      x: number;
      y: number;
      w: number;
      h: number;
      hp: number;
      maxHp: number;
      color: string;
    }

    interface PowerUp {
      x: number;
      y: number;
      type: 'laser' | 'multiball' | 'expand';
      vy: number;
    }

    let powerups: PowerUp[] = [];

    // Generate bricks based on level pattern
    const rows = 4 + Math.min(6, Math.floor(level / 3));
    const cols = 8 + (level % 3);
    const bricks: Brick[] = [];
    const colors = ['#06b6d4', '#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6'];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Skip some bricks in later levels to make interesting patterns
        if (level % 2 === 1 && (r + c) % 4 === 0) continue;
        if (level % 3 === 0 && r % 2 === 1 && c % 2 === 1) continue;

        const hp = r === 0 && level > 5 ? 2 : 1;
        bricks.push({
          x: (c + 0.5) / (cols + 1),
          y: 0.12 + (r * 0.05),
          w: 0.85 / cols,
          h: 0.035,
          hp,
          maxHp: hp,
          color: colors[r % colors.length],
        });
      }
    }

    // Controls
    let moveLeft = false;
    let moveRight = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) moveLeft = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) moveRight = true;
      if (['Space', 'KeyW', 'ArrowUp'].includes(e.code) && laserTimer > 0) {
        lasers.push({ x: paddleX - paddleW * 0.35, y: 0.88 });
        lasers.push({ x: paddleX + paddleW * 0.35, y: 0.88 });
        sound.playLaser();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) moveLeft = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) moveRight = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const norm = (e.clientX - rect.left) / rect.width;
      paddleX = Math.max(paddleW * 0.5, Math.min(1 - paddleW * 0.5, norm));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!canvas || !e.touches[0]) return;
      const rect = canvas.getBoundingClientRect();
      const norm = (e.touches[0].clientX - rect.left) / rect.width;
      paddleX = Math.max(paddleW * 0.5, Math.min(1 - paddleW * 0.5, norm));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove);

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
        // Keyboard move
        if (moveLeft) paddleX = Math.max(paddleW * 0.5, paddleX - dt * 0.8);
        if (moveRight) paddleX = Math.min(1 - paddleW * 0.5, paddleX + dt * 0.8);

        if (laserTimer > 0) {
          laserTimer -= dt;
          // Auto fire lasers every 0.3s
          if (Math.random() < dt * 3.5) {
            lasers.push({ x: paddleX - paddleW * 0.35, y: 0.88 });
            lasers.push({ x: paddleX + paddleW * 0.35, y: 0.88 });
            sound.playLaser();
          }
        }

        // Update lasers
        for (let l = lasers.length - 1; l >= 0; l--) {
          lasers[l].y -= dt * 1.2;
          // check brick collision
          for (let b = bricks.length - 1; b >= 0; b--) {
            const brick = bricks[b];
            if (
              lasers[l] &&
              lasers[l].x >= brick.x - brick.w * 0.5 &&
              lasers[l].x <= brick.x + brick.w * 0.5 &&
              lasers[l].y >= brick.y - brick.h * 0.5 &&
              lasers[l].y <= brick.y + brick.h * 0.5
            ) {
              lasers.splice(l, 1);
              brick.hp -= 1;
              if (brick.hp <= 0) {
                bricks.splice(b, 1);
                currentScore += 100;
                sound.playWhack();
              }
              break;
            }
          }
          if (lasers[l] && lasers[l].y < 0) lasers.splice(l, 1);
        }

        // Update powerups
        for (let p = powerups.length - 1; p >= 0; p--) {
          const pup = powerups[p];
          pup.y += pup.vy * dt;

          // Check paddle collision
          if (pup.y >= 0.88 && pup.y <= 0.92) {
            if (Math.abs(pup.x - paddleX) < paddleW * 0.55) {
              sound.playCoin();
              if (pup.type === 'laser') laserTimer = 8;
              if (pup.type === 'expand') paddleW = Math.min(0.32, paddleW * 1.3);
              if (pup.type === 'multiball' && balls.length > 0) {
                const b0 = balls[0];
                balls.push({ x: b0.x, y: b0.y, vx: b0.vx * 0.8 + 0.002, vy: b0.vy, radius: 8 });
                balls.push({ x: b0.x, y: b0.y, vx: b0.vx * 0.8 - 0.002, vy: b0.vy, radius: 8 });
              }
              powerups.splice(p, 1);
              continue;
            }
          }
          if (pup.y > 1.05) powerups.splice(p, 1);
        }

        // Update balls
        for (let i = balls.length - 1; i >= 0; i--) {
          const ball = balls[i];
          ball.x += ball.vx * (dt / 0.016);
          ball.y += ball.vy * (dt / 0.016);

          // Left/right wall bounce
          if (ball.x <= 0.02) {
            ball.x = 0.02;
            ball.vx = Math.abs(ball.vx);
            sound.playTone(480, 'sine', 0.04);
          } else if (ball.x >= 0.98) {
            ball.x = 0.98;
            ball.vx = -Math.abs(ball.vx);
            sound.playTone(480, 'sine', 0.04);
          }

          // Top wall bounce
          if (ball.y <= 0.04) {
            ball.y = 0.04;
            ball.vy = Math.abs(ball.vy);
            sound.playTone(520, 'sine', 0.04);
          }

          // Paddle bounce
          if (ball.y >= 0.88 && ball.y <= 0.91 && ball.vy > 0) {
            if (Math.abs(ball.x - paddleX) < paddleW * 0.55) {
              const hitOffset = (ball.x - paddleX) / (paddleW * 0.5); // -1 to 1
              ball.vx = hitOffset * 0.0055;
              ball.vy = -Math.abs(ball.vy);
              sound.playTone(650, 'triangle', 0.06);
            }
          }

          // Brick collisions
          for (let b = bricks.length - 1; b >= 0; b--) {
            const br = bricks[b];
            if (
              ball.x >= br.x - br.w * 0.5 &&
              ball.x <= br.x + br.w * 0.5 &&
              ball.y >= br.y - br.h * 0.5 &&
              ball.y <= br.y + br.h * 0.5
            ) {
              ball.vy = -ball.vy;
              br.hp -= 1;
              currentScore += 50;

              if (br.hp <= 0) {
                // Chance to drop powerup
                if (Math.random() < 0.28) {
                  const types: ('laser' | 'multiball' | 'expand')[] = ['laser', 'multiball', 'expand'];
                  powerups.push({
                    x: br.x,
                    y: br.y,
                    type: types[Math.floor(Math.random() * types.length)],
                    vy: 0.15,
                  });
                }
                bricks.splice(b, 1);
                sound.playTone(780, 'sine', 0.08);
              } else {
                sound.playTone(380, 'square', 0.05);
              }
              break;
            }
          }

          // Bottom screen: lost ball
          if (ball.y > 1.0) {
            balls.splice(i, 1);
          }
        }

        // Check if all balls lost
        if (balls.length === 0) {
          currentLives -= 1;
          setLives(currentLives);
          sound.playHit();
          if (currentLives <= 0) {
            setGameOver(true);
            return;
          } else {
            // Reset ball on paddle
            balls = [{ x: paddleX, y: 0.85, vx: 0.0035, vy: -0.0055, radius: 8 }];
          }
        }

        // Check win (all bricks cleared)
        if (bricks.length === 0) {
          sound.playWin();
          setGameWon(true);
          return;
        }

        setScore(currentScore);
      }

      // RENDER
      // Deep space grid background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#090d16');
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Subtle background grid
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.07)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Render Bricks
      for (const br of bricks) {
        const bx = (br.x - br.w * 0.5) * w;
        const by = (br.y - br.h * 0.5) * h;
        const bw = br.w * w;
        const bh = br.h * h;

        ctx.fillStyle = br.color;
        ctx.shadowColor = br.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(bx + 1, by + 1, bw - 2, bh - 2, 4);
        ctx.fill();

        // Inner bevel highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(bx + 3, by + 2, bw - 6, 2);
        ctx.shadowBlur = 0;
      }

      // Render PowerUps
      for (const pup of powerups) {
        const px = pup.x * w;
        const py = pup.y * h;
        const pColor = pup.type === 'laser' ? '#ef4444' : pup.type === 'multiball' ? '#eab308' : '#10b981';

        ctx.fillStyle = pColor;
        ctx.shadowColor = pColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(px, py, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pup.type[0].toUpperCase(), px, py);
      }

      // Render Lasers
      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 8;
      for (const l of lasers) {
        ctx.fillRect(l.x * w - 2, l.y * h, 4, 14);
      }
      ctx.shadowBlur = 0;

      // Render Paddle
      const px = (paddleX - paddleW * 0.5) * w;
      const py = 0.89 * h;
      const pw = paddleW * w;
      const ph = 14;

      const padGrad = ctx.createLinearGradient(px, 0, px + pw, 0);
      padGrad.addColorStop(0, '#06b6d4');
      padGrad.addColorStop(0.5, '#38bdf8');
      padGrad.addColorStop(1, '#06b6d4');
      ctx.fillStyle = padGrad;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, 7);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Render Balls
      for (const ball of balls) {
        const bx = ball.x * w;
        const by = ball.y * h;

        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(bx, by, ball.radius, 0, Math.PI * 2);
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
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
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

        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow">
          <span className="text-slate-400">LIVES:</span>
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={i < lives ? 'text-rose-500' : 'text-slate-600'}>
                ♥
              </span>
            ))}
          </div>
        </div>
      </div>

      {gameOver && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-rose-500">PADDLE LOST!</h2>
          <p className="text-slate-300 text-sm mt-2">All balls out of play. Score: {score}</p>
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
          <h2 className="text-3xl font-black text-cyan-400">BRICKS CLEARED!</h2>
          <p className="text-slate-300 text-sm mt-2">All prism bricks shattered! Score: {score}</p>
          <button
            onClick={() => {
              setGameWon(false);
              onNextLevel();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm shadow-lg"
          >
            Next Stage (Level {Math.min(30, level + 1)})
          </button>
        </div>
      )}
    </div>
  );
};
