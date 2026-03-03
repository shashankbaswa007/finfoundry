"use client";

import { useEffect, useState, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════
 * OfflinePage v2.0 — Self-contained offline fallback
 *
 * ZERO external dependencies (no Framer Motion, no Lucide icons).
 * Everything is inline CSS + vanilla JS so the page works perfectly
 * from the service worker cache without needing any JS chunks.
 *
 * Features:
 *   - Auto-reconnect listener → redirects when back online
 *   - CSS-only animations (fadeIn, slideUp, float, pulse)
 *   - "Catch the Coin" mini-game: tap/click falling coins
 *   - Responsive, FinFoundry-branded
 * ═══════════════════════════════════════════════════════════════════ */

/* ── Coin Game ────────────────────────────────────────────────── */

interface Coin {
  id: number;
  x: number;       // % from left
  speed: number;    // px per frame
  y: number;        // current y
  caught: boolean;
}

function CoinGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const coinsRef = useRef<Coin[]>([]);
  const frameRef = useRef<number>(0);
  const nextIdRef = useRef(0);
  const scoreRef = useRef(0);
  const missedRef = useRef(0);

  const startGame = useCallback(() => {
    coinsRef.current = [];
    nextIdRef.current = 0;
    scoreRef.current = 0;
    missedRef.current = 0;
    setScore(0);
    setGameOver(false);
    setPlaying(true);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    let spawnTimer = 0;

    const loop = () => {
      ctx.clearRect(0, 0, W, H);

      // Spawn coins
      spawnTimer++;
      const spawnRate = Math.max(20, 60 - scoreRef.current * 2);
      if (spawnTimer >= spawnRate) {
        spawnTimer = 0;
        coinsRef.current.push({
          id: nextIdRef.current++,
          x: 10 + Math.random() * 80,
          speed: 1.5 + Math.random() * 1.5 + scoreRef.current * 0.08,
          y: -20,
          caught: false,
        });
      }

      // Update & draw coins
      for (const coin of coinsRef.current) {
        if (coin.caught) continue;
        coin.y += coin.speed;

        const cx = (coin.x / 100) * W;
        const cy = coin.y;
        const r = 14;

        // Gold coin
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = "#F5C542";
        ctx.fill();
        ctx.strokeStyle = "#D4A82A";
        ctx.lineWidth = 2;
        ctx.stroke();

        // $ symbol
        ctx.fillStyle = "#8B6914";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("$", cx, cy + 1);

        if (coin.y > H + 20) {
          coin.caught = true;
          missedRef.current++;
          if (missedRef.current >= 5) {
            setPlaying(false);
            setGameOver(true);
            setHighScore((prev) => Math.max(prev, scoreRef.current));
          }
        }
      }

      // Clean up caught coins
      coinsRef.current = coinsRef.current.filter((c) => !c.caught);

      // HUD
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Missed: ${missedRef.current}/5`, 8, 18);

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [playing]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!playing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const W = canvas.width;

    for (const coin of coinsRef.current) {
      if (coin.caught) continue;
      const cx = (coin.x / 100) * W;
      const cy = coin.y;
      const dist = Math.sqrt((clickX - cx) ** 2 + (clickY - cy) ** 2);
      if (dist < 22) {
        coin.caught = true;
        scoreRef.current++;
        setScore(scoreRef.current);
        break;
      }
    }
  }, [playing]);

  const handleTouch = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!playing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const clickX = touch.clientX - rect.left;
    const clickY = touch.clientY - rect.top;
    const W = canvas.width;

    for (const coin of coinsRef.current) {
      if (coin.caught) continue;
      const cx = (coin.x / 100) * W;
      const cy = coin.y;
      const dist = Math.sqrt((clickX - cx) ** 2 + (clickY - cy) ** 2);
      if (dist < 30) {  // Larger touch target
        coin.caught = true;
        scoreRef.current++;
        setScore(scoreRef.current);
        break;
      }
    }
  }, [playing]);

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 12 }}>
        <span style={{ color: "#F5C542", fontWeight: 700, fontSize: 18 }}>
          🪙 {score}
        </span>
        {highScore > 0 && (
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
            Best: {highScore}
          </span>
        )}
      </div>

      <div style={{ position: "relative", display: "inline-block" }}>
        <canvas
          ref={canvasRef}
          width={280}
          height={360}
          onClick={handleClick}
          onTouchStart={handleTouch}
          style={{
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
            cursor: playing ? "crosshair" : "default",
            touchAction: "none",
          }}
        />

        {/* Overlay: Start / Game Over */}
        {!playing && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 16,
              background: "rgba(5,8,22,0.85)",
              backdropFilter: "blur(4px)",
            }}
          >
            {gameOver ? (
              <>
                <span style={{ fontSize: 28, marginBottom: 4 }}>📉</span>
                <p style={{ color: "#F5C542", fontWeight: 700, fontSize: 16, margin: "0 0 4px" }}>
                  Market Crashed!
                </p>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "0 0 16px" }}>
                  You caught <b style={{ color: "#10B981" }}>{score}</b> coins
                </p>
              </>
            ) : (
              <>
                <span style={{ fontSize: 28, marginBottom: 4 }}>🪙</span>
                <p style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: 14, margin: "0 0 4px" }}>
                  Catch the Coins!
                </p>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, margin: "0 0 16px", maxWidth: 200 }}>
                  Tap falling coins before they drop. Miss 5 and the market crashes!
                </p>
              </>
            )}
            <button
              onClick={startGame}
              style={{
                padding: "8px 24px",
                borderRadius: 8,
                border: "1px solid rgba(16,185,129,0.3)",
                background: "rgba(16,185,129,0.1)",
                color: "#34D399",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {gameOver ? "Play Again" : "Start Game"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────────── */

export function OfflinePage() {
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const onOnline = () => window.location.replace("/");
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => window.location.reload(), 600);
  };

  return (
    <>
      <style>{`
        @keyframes offFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes offSlideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes offFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
        @keyframes offPulse { 0%,100% { opacity: 0.2 } 50% { opacity: 0.5 } }
        @keyframes offSpin { to { transform: rotate(360deg) } }
        .off-particle { position: absolute; width: 4px; height: 4px; border-radius: 50%; background: rgba(16,185,129,0.15); animation: offPulse 3s ease-in-out infinite; }
      `}</style>
      <div
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          background: "#050816",
          fontFamily: "'Inter', system-ui, sans-serif",
          padding: "24px 16px",
        }}
      >
        {/* Atmospheric gradient */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 60% 50% at 50% 45%, rgba(16,185,129,0.06), transparent)" }} />

        {/* Particles */}
        {[15, 30, 50, 65, 78, 88].map((left, i) => (
          <div
            key={i}
            className="off-particle"
            style={{ left: `${left}%`, top: `${20 + (i % 3) * 25}%`, animationDelay: `${i * 0.6}s` }}
          />
        ))}

        {/* Main content */}
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 420, animation: "offFadeIn 0.6s ease" }}>

          {/* Wifi-off icon */}
          <div
            style={{
              margin: "0 auto 24px",
              width: 72,
              height: 72,
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.03)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "offSlideUp 0.5s ease, offFloat 4s ease-in-out 0.5s infinite",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(16,185,129,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="2" y1="2" x2="22" y2="22" />
              <path d="M8.5 16.5a5 5 0 0 1 7 0" />
              <path d="M2 8.82a15 15 0 0 1 4.17-2.65" />
              <path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76" />
              <path d="M16.85 11.25a10 10 0 0 1 2.22 1.68" />
              <path d="M5 12.86a10 10 0 0 1 5.17-2.87" />
              <line x1="12" y1="20" x2="12.01" y2="20" />
            </svg>
          </div>

          {/* Heading */}
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "rgba(255,255,255,0.9)", margin: "0 0 8px", letterSpacing: "-0.02em", animation: "offSlideUp 0.5s ease 0.15s backwards" }}>
            You&apos;re Offline
          </h1>

          {/* Description */}
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, margin: "0 0 24px", animation: "offSlideUp 0.5s ease 0.25s backwards" }}>
            No internet connection detected. We&apos;ll automatically reconnect when you&apos;re back online.
          </p>

          {/* Retry button */}
          <button
            onClick={handleRetry}
            disabled={retrying}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 24px",
              borderRadius: 8,
              border: "1px solid rgba(16,185,129,0.2)",
              background: "rgba(16,185,129,0.08)",
              color: "rgba(255,255,255,0.85)",
              fontWeight: 500,
              fontSize: 13,
              cursor: retrying ? "not-allowed" : "pointer",
              opacity: retrying ? 0.5 : 1,
              animation: "offSlideUp 0.5s ease 0.35s backwards",
              transition: "background 0.2s, border-color 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(16,185,129,0.14)"; e.currentTarget.style.borderColor = "rgba(16,185,129,0.3)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(16,185,129,0.08)"; e.currentTarget.style.borderColor = "rgba(16,185,129,0.2)"; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(16,185,129,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={retrying ? { animation: "offSpin 1s linear infinite" } : undefined}>
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            {retrying ? "Reconnecting…" : "Try Again"}
          </button>

          {/* Divider */}
          <div style={{ margin: "32px auto 24px", width: 48, height: 1, background: "rgba(255,255,255,0.06)" }} />

          {/* Mini-game */}
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
            While you wait...
          </p>
          <CoinGame />

          {/* Brand footer */}
          <div style={{ marginTop: 32, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "rgba(255,255,255,0.15)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            <div style={{ width: 24, height: 1, background: "linear-gradient(to right, transparent, rgba(255,255,255,0.1))" }} />
            <span>
              <span style={{ color: "rgba(16,185,129,0.3)" }}>Fin</span>
              <span style={{ color: "rgba(245,197,66,0.3)" }}>Foundry</span>
            </span>
            <div style={{ width: 24, height: 1, background: "linear-gradient(to left, transparent, rgba(255,255,255,0.1))" }} />
          </div>
        </div>
      </div>
    </>
  );
}
