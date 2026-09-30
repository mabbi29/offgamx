import React, { useRef, useEffect, useState } from 'react';
import { ActiveGameContext } from '../types';
import { sound } from '../utils/audio';

export const GoingBalls: React.FC<ActiveGameContext> = ({
  level,
  isPaused,
  onNextLevel,
  onRestart,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [gems, setGems] = useState(0);
  const [progress, setProgress] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  const steerTouch = useRef<-1 | 0 | 1>(0);
  const jumpTouch = useRef<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let ballX = 0; // -1 to 1 across track
    let ballZ = 0; // forward distance
    let ballY = 0; // jump height
    let vy = 0; // vertical velocity
    let isGrounded = true;
    let rollAngle = 0;
    const trackLength = 1200 + level * 400;

    let collectedGems = 0;

    // Track segments with potential gaps
    interface TrackObstacle {
      z: number;
      type: 'gem' | 'block' | 'gap';
      x: number;
      collected?: boolean;
    }

    const items: TrackObstacle[] = [];
    for (let z = 150; z < trackLength - 100; z += 60) {
      const rand = Math.random();
      if (rand < 0.4) {
        items.push({ z, type: 'gem', x: (Math.random() - 0.5) * 1.2 });
      } else if (rand < 0.7 && z > 300) {
        items.push({ z, type: 'block', x: (Math.random() - 0.5) * 1.0 });
      }
    }

    // Keyboard
    const keys: Record<string, boolean> = {};
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space', 'KeyA', 'KeyD', 'KeyW'].includes(e.code)) {
        e.preventDefault();
      }
      keys[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

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
        // Forward roll speed
        const forwardSpeed = 160 + level * 8;
        ballZ += forwardSpeed * dt;
        rollAngle += dt * 10;

        // Steering
        let steer = 0;
        if (keys['ArrowLeft'] || keys['KeyA'] || steerTouch.current === -1) steer -= 1;
        if (keys['ArrowRight'] || keys['KeyD'] || steerTouch.current === 1) steer += 1;
        ballX += steer * dt * 1.6;

        // Jump
        const wantJump = keys['Space'] || keys['ArrowUp'] || keys['KeyW'] || jumpTouch.current;
        if (wantJump && isGrounded) {
          vy = 7.5;
          isGrounded = false;
          sound.playJump();
        }

        // Gravity
        if (!isGrounded) {
          ballY += vy * dt * 30;
          vy -= dt * 24;
          if (ballY <= 0) {
            ballY = 0;
            vy = 0;
            isGrounded = true;
          }
        }

        // Check if ball fell off track width
        if (Math.abs(ballX) > 1.35) {
          sound.playExplosion();
          setGameOver(true);
          return;
        }

        // Check items & obstacles
        for (const it of items) {
          if (Math.abs(ballZ - it.z) < 18) {
            if (it.type === 'gem' && !it.collected) {
              if (Math.abs(ballX - it.x) < 0.35) {
                it.collected = true;
                collectedGems += 1;
                setGems(collectedGems);
                sound.playCoin();
              }
            } else if (it.type === 'block') {
              if (Math.abs(ballX - it.x) < 0.3 && ballY < 25) {
                sound.playHit();
                setGameOver(true);
                return;
              }
            }
          }
        }

        const pct = Math.min(100, Math.floor((ballZ / trackLength) * 100));
        setProgress(pct);

        // Finish line reached
        if (ballZ >= trackLength) {
          sound.playWin();
          setGameWon(true);
          return;
        }
      }

      // RENDER
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      const horizonY = h * 0.4;

      // Sky gradient (High altitude azure & clouds)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(0.6, '#38bdf8');
      skyGrad.addColorStop(1, '#bae6fd');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, horizonY);

      // Distant clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let c = 0; c < 5; c++) {
        const cx = ((c * 220 + ballZ * 0.05) % (w + 200)) - 100;
        ctx.beginPath();
        ctx.arc(cx, horizonY * 0.5 + (c % 2) * 20, 35, 0, Math.PI * 2);
        ctx.arc(cx + 25, horizonY * 0.5 + (c % 2) * 20 - 10, 45, 0, Math.PI * 2);
        ctx.arc(cx + 60, horizonY * 0.5 + (c % 2) * 20, 30, 0, Math.PI * 2);
        ctx.fill();
      }

      // Sea / Abyss below
      const seaGrad = ctx.createLinearGradient(0, horizonY, 0, h);
      seaGrad.addColorStop(0, '#0c4a6e');
      seaGrad.addColorStop(1, '#082f49');
      ctx.fillStyle = seaGrad;
      ctx.fillRect(0, horizonY, w, h - horizonY);

      // Track projection in 3D
      const trackBaseW = w * 0.55;
      const trackTopW = w * 0.06;
      const centerX = w * 0.5;

      // Draw suspended track planks
      const numPlanks = 30;
      const offset = (ballZ * 0.1) % 1;

      for (let i = numPlanks - 1; i >= 0; i--) {
        const p1 = (i + offset) / numPlanks;
        const p2 = (i + offset + 0.9) / numPlanks;
        if (p1 > 1) continue;

        const y1 = horizonY + Math.pow(p1, 2) * (h - horizonY);
        const y2 = horizonY + Math.pow(Math.min(1, p2), 2) * (h - horizonY);
        const tw1 = trackTopW + (trackBaseW - trackTopW) * Math.pow(p1, 2);
        const tw2 = trackTopW + (trackBaseW - trackTopW) * Math.pow(Math.min(1, p2), 2);

        // Rainbow edge rails
        const rainbowColors = ['#f43f5e', '#f97316', '#eab308', '#10b981', '#06b6d4', '#8b5cf6'];
        const railColor = rainbowColors[(i + Math.floor(ballZ * 0.05)) % rainbowColors.length];

        // Track surface plank
        ctx.fillStyle = i % 2 === 0 ? '#f1f5f9' : '#e2e8f0';
        ctx.beginPath();
        ctx.moveTo(centerX - tw1 * 0.5, y1);
        ctx.lineTo(centerX + tw1 * 0.5, y1);
        ctx.lineTo(centerX + tw2 * 0.5, y2);
        ctx.lineTo(centerX - tw2 * 0.5, y2);
        ctx.fill();

        // Left rail
        ctx.fillStyle = railColor;
        ctx.fillRect(centerX - tw1 * 0.5 - 6, y1 - 4, 6, Math.max(3, y2 - y1 + 4));
        // Right rail
        ctx.fillRect(centerX + tw1 * 0.5, y1 - 4, 6, Math.max(3, y2 - y1 + 4));
      }

      // Draw items (gems & obstacle blocks)
      for (const it of items) {
        const relZ = it.z - ballZ;
        if (relZ > 0 && relZ < 500 && !it.collected) {
          const normZ = 1 - relZ / 500;
          const p = Math.pow(normZ, 2);
          const itemY = horizonY + p * (h - horizonY);
          const tw = trackTopW + (trackBaseW - trackTopW) * p;
          const itemX = centerX + it.x * tw * 0.45;
          const size = Math.max(8, 22 * p);

          if (it.type === 'gem') {
            // Golden diamond gem
            ctx.fillStyle = '#facc15';
            ctx.shadowColor = '#facc15';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(itemX, itemY - size);
            ctx.lineTo(itemX + size * 0.7, itemY);
            ctx.lineTo(itemX, itemY + size * 0.7);
            ctx.lineTo(itemX - size * 0.7, itemY);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
          } else {
            // Hazard red block
            ctx.fillStyle = '#ef4444';
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 6;
            ctx.fillRect(itemX - size * 0.5, itemY - size, size, size);
            ctx.shadowBlur = 0;
          }
        }
      }

      // Draw Finish Arch if near track end
      const finishRelZ = trackLength - ballZ;
      if (finishRelZ > 0 && finishRelZ < 600) {
        const normZ = 1 - finishRelZ / 600;
        const p = Math.pow(normZ, 2);
        const archY = horizonY + p * (h - horizonY);
        const tw = trackTopW + (trackBaseW - trackTopW) * p;
        const archW = tw * 1.1;
        const archH = 55 * p;

        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 8 * p;
        ctx.strokeRect(centerX - archW * 0.5, archY - archH, archW, archH);
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(10, 16 * p)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('FINISH', centerX, archY - archH * 0.5);
      }

      // Draw Player Ball (Rainbow Rolling Sphere)
      const ballRadius = Math.max(22, w * 0.038);
      const playerScreenY = h * 0.82 - ballY;
      const playerScreenX = centerX + ballX * trackBaseW * 0.44;

      // Ball shadow on track
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(playerScreenX, h * 0.82 + 4, ballRadius * 0.9, ballRadius * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ball 3D shading & rotating rainbow pattern
      ctx.save();
      ctx.translate(playerScreenX, playerScreenY);
      ctx.rotate(rollAngle);

      const ballGrad = ctx.createRadialGradient(-ballRadius * 0.3, -ballRadius * 0.3, ballRadius * 0.1, 0, 0, ballRadius);
      ballGrad.addColorStop(0, '#fef08a');
      ballGrad.addColorStop(0.3, '#f43f5e');
      ballGrad.addColorStop(0.7, '#06b6d4');
      ballGrad.addColorStop(1, '#3b82f6');

      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(0, 0, ballRadius, 0, Math.PI * 2);
      ctx.fill();

      // Ball surface seams / stripes
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, ballRadius * 0.6, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      ro.disconnect();
    };
  }, [level, isPaused, gameOver, gameWon]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[460px] bg-slate-950 select-none overflow-hidden flex flex-col">
      <canvas ref={canvasRef} className="w-full h-full flex-1 block" />

      {/* HUD overlay */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none text-white font-mono text-xs">
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow">
          <span className="text-cyan-400 font-bold">LEVEL {level} / 25</span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400 font-bold">★ {gems} GEMS</span>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow">
          <span>TRACK: {progress}%</span>
          <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div className="h-full bg-cyan-400 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Touch controls */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-auto sm:hidden">
        <div className="flex gap-2">
          <button
            onTouchStart={() => (steerTouch.current = -1)}
            onTouchEnd={() => (steerTouch.current = 0)}
            className="w-14 h-14 rounded-2xl bg-slate-800/80 active:bg-cyan-500 text-white font-bold text-lg flex items-center justify-center border border-slate-700"
          >
            ←
          </button>
          <button
            onTouchStart={() => (steerTouch.current = 1)}
            onTouchEnd={() => (steerTouch.current = 0)}
            className="w-14 h-14 rounded-2xl bg-slate-800/80 active:bg-cyan-500 text-white font-bold text-lg flex items-center justify-center border border-slate-700"
          >
            →
          </button>
        </div>

        <button
          onTouchStart={() => (jumpTouch.current = true)}
          onTouchEnd={() => (jumpTouch.current = false)}
          className="w-20 h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center border border-cyan-400 shadow-lg shadow-cyan-500/20"
        >
          JUMP
        </button>
      </div>

      {gameOver && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-rose-500">BALL FELL!</h2>
          <p className="text-slate-300 text-sm mt-2">Balance on the sky track and dodge blocks.</p>
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
          <h2 className="text-3xl font-black text-cyan-400">FINISH LINE!</h2>
          <p className="text-slate-300 text-sm mt-2">You cleared the sky course with {gems} gems.</p>
          <button
            onClick={() => {
              setGameWon(false);
              onNextLevel();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm shadow-lg"
          >
            Next Track (Level {Math.min(25, level + 1)})
          </button>
        </div>
      )}
    </div>
  );
};
