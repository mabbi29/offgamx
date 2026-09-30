import React, { useRef, useEffect, useState } from 'react';
import { ActiveGameContext } from '../types';
import { sound } from '../utils/audio';

export const CyberSmash: React.FC<ActiveGameContext> = ({
  level,
  isPaused,
  onNextLevel,
  onRestart,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let pScore = 0;
    let cpuScore = 0;
    const targetWins = 5;

    // Table coordinates: normalized X (0 to 1), Y (0 to 1)
    let playerPaddleX = 0.5;
    let playerPaddleY = 0.88;
    let aiPaddleX = 0.5;
    let aiPaddleY = 0.12;

    const paddleW = 0.18;

    // Ball state
    let ball = {
      x: 0.5,
      y: 0.5,
      vx: 0.004,
      vy: 0.007 + level * 0.0004,
      radius: 9,
    };

    // Keyboard controls
    let moveLeft = false;
    let moveRight = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) moveLeft = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) moveRight = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) moveLeft = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) moveRight = false;
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const nx = (clientX - rect.left) / rect.width;
      playerPaddleX = Math.max(paddleW * 0.5, Math.min(1 - paddleW * 0.5, nx));
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

    const resetBall = (towardsAi: boolean) => {
      ball.x = 0.5;
      ball.y = 0.5;
      ball.vx = (Math.random() - 0.5) * 0.006;
      ball.vy = (towardsAi ? -1 : 1) * (0.007 + level * 0.0004);
    };

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);

      if (!isPaused && !gameOver && !gameWon) {
        if (moveLeft) playerPaddleX = Math.max(paddleW * 0.5, playerPaddleX - dt * 1.2);
        if (moveRight) playerPaddleX = Math.min(1 - paddleW * 0.5, playerPaddleX + dt * 1.2);

        // AI tracking
        const aiSpeed = (0.55 + Math.min(0.35, level * 0.025)) * dt;
        if (aiPaddleX < ball.x - 0.02) aiPaddleX += aiSpeed;
        if (aiPaddleX > ball.x + 0.02) aiPaddleX -= aiSpeed;
        aiPaddleX = Math.max(paddleW * 0.5, Math.min(1 - paddleW * 0.5, aiPaddleX));

        // Ball movement
        ball.x += ball.vx * (dt / 0.016);
        ball.y += ball.vy * (dt / 0.016);

        // Side wall bounce
        if (ball.x <= 0.05) {
          ball.x = 0.05;
          ball.vx = Math.abs(ball.vx);
          sound.playTone(500, 'sine', 0.04);
        } else if (ball.x >= 0.95) {
          ball.x = 0.95;
          ball.vx = -Math.abs(ball.vx);
          sound.playTone(500, 'sine', 0.04);
        }

        // Player Paddle collision
        if (ball.y >= playerPaddleY - 0.03 && ball.y <= playerPaddleY + 0.02 && ball.vy > 0) {
          if (Math.abs(ball.x - playerPaddleX) < paddleW * 0.55) {
            const hitOffset = (ball.x - playerPaddleX) / (paddleW * 0.5);
            ball.vx = hitOffset * 0.009;
            ball.vy = -Math.abs(ball.vy) * 1.04;
            sound.playWhack();
          }
        }

        // AI Paddle collision
        if (ball.y <= aiPaddleY + 0.03 && ball.y >= aiPaddleY - 0.02 && ball.vy < 0) {
          if (Math.abs(ball.x - aiPaddleX) < paddleW * 0.55) {
            const hitOffset = (ball.x - aiPaddleX) / (paddleW * 0.5);
            ball.vx = hitOffset * 0.009;
            ball.vy = Math.abs(ball.vy) * 1.04;
            sound.playWhack();
          }
        }

        // Scoring
        if (ball.y > 1.02) {
          // AI scored
          cpuScore++;
          setAiScore(cpuScore);
          sound.playHit();
          if (cpuScore >= targetWins) {
            setGameOver(true);
            return;
          } else {
            resetBall(true);
          }
        } else if (ball.y < -0.02) {
          // Player scored!
          pScore++;
          setPlayerScore(pScore);
          sound.playCoin();
          if (pScore >= targetWins) {
            sound.playWin();
            setGameWon(true);
            return;
          } else {
            resetBall(false);
          }
        }
      }

      // RENDER
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);

      // 3D Tennis Court Table Perspective
      const tableTopW = w * 0.65;
      const tableBottomW = w * 0.88;
      const tableTopY = h * 0.08;
      const tableBottomY = h * 0.92;

      ctx.beginPath();
      ctx.moveTo(w * 0.5 - tableTopW * 0.5, tableTopY);
      ctx.lineTo(w * 0.5 + tableTopW * 0.5, tableTopY);
      ctx.lineTo(w * 0.5 + tableBottomW * 0.5, tableBottomY);
      ctx.lineTo(w * 0.5 - tableBottomW * 0.5, tableBottomY);
      ctx.closePath();

      const tableGrad = ctx.createLinearGradient(0, tableTopY, 0, tableBottomY);
      tableGrad.addColorStop(0, '#1e293b');
      tableGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = tableGrad;
      ctx.fill();

      // Table Borders
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Center Net Line
      const netY = h * 0.5;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(w * 0.5 - (tableTopW + tableBottomW) * 0.25, netY);
      ctx.lineTo(w * 0.5 + (tableTopW + tableBottomW) * 0.25, netY);
      ctx.stroke();

      // AI Paddle
      const aiPx = aiPaddleX * w;
      const aiPy = aiPaddleY * h;
      const aiPw = paddleW * w * 0.8;
      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(aiPx - aiPw * 0.5, aiPy - 5, aiPw, 10, 4);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Player Paddle
      const pPx = playerPaddleX * w;
      const pPy = playerPaddleY * h;
      const pPw = paddleW * w;
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect(pPx - pPw * 0.5, pPy - 7, pPw, 14, 6);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Aero Ball
      const bx = ball.x * w;
      const by = ball.y * h;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(bx, by, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

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
      <canvas ref={canvasRef} className="w-full h-full flex-1 block cursor-ew-resize" />

      {/* Top HUD */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none text-white font-mono text-xs">
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow">
          <span className="text-cyan-400 font-bold">MATCH {level} / 20</span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400 font-bold">RALLY TO 5</span>
        </div>

        <div className="flex items-center gap-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow text-sm font-bold">
          <span className="text-cyan-400">YOU: {playerScore}</span>
          <span className="text-slate-600">-</span>
          <span className="text-rose-400">AI: {aiScore}</span>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none text-slate-400 text-xs bg-slate-900/70 px-4 py-1.5 rounded-full border border-slate-700/60">
        Move mouse or touch to position cyber paddle and angle return volleys
      </div>

      {gameOver && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-rose-500">MATCH DEFEAT!</h2>
          <p className="text-slate-300 text-sm mt-2">AI won the final set.</p>
          <button
            onClick={() => {
              setGameOver(false);
              onRestart();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg"
          >
            Rematch
          </button>
        </div>
      )}

      {gameWon && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-cyan-400">SET WON! CHAMPION!</h2>
          <p className="text-slate-300 text-sm mt-2">Tournament match secured.</p>
          <button
            onClick={() => {
              setGameWon(false);
              onNextLevel();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm shadow-lg"
          >
            Next Opponent (Match {Math.min(20, level + 1)})
          </button>
        </div>
      )}
    </div>
  );
};
