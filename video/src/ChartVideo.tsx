import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const BAR_DATA = [
  { label: "Q1", value: 0.45, color: "#6366f1" },
  { label: "Q2", value: 0.62, color: "#8b5cf6" },
  { label: "Q3", value: 0.55, color: "#a78bfa" },
  { label: "Q4", value: 0.78, color: "#7c3aed" },
];

const MAX_BAR_HEIGHT = 280;

function GlowFilter() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-strong" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="16" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="barGrad0" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id="barGrad1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="barGrad3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function AnimatedBar({
  value,
  index,
  label,
  frame,
  fps,
}: {
  value: number;
  index: number;
  label: string;
  frame: number;
  fps: number;
}) {
  const delay = index * 8;
  const progress = spring({
    fps,
    frame: Math.max(0, frame - delay),
    config: { damping: 14, stiffness: 80, mass: 1 },
    durationInFrames: 60,
  });

  const barHeight = progress * value * MAX_BAR_HEIGHT;
  const barWidth = 64;
  const opacity = interpolate(Math.max(0, frame - delay), [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        opacity,
      }}
    >
      <div
        style={{
          width: barWidth,
          height: MAX_BAR_HEIGHT,
          display: "flex",
          alignItems: "flex-end",
          position: "relative",
        }}
      >
        {/* Glow base */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: barWidth + 20,
            height: barHeight + 20,
            background: `radial-gradient(ellipse at 50% 100%, rgba(139,92,246,0.5) 0%, transparent 70%)`,
            filter: "blur(12px)",
            borderRadius: 12,
          }}
        />
        {/* Main bar */}
        <div
          style={{
            width: barWidth,
            height: barHeight,
            borderRadius: "10px 10px 4px 4px",
            background: `url(#barGrad${index}) linear-gradient(to bottom, #a78bfa, #5b21b6)`,
            backgroundImage: `linear-gradient(to bottom, ${
              ["#818cf8,#4f46e5", "#a78bfa,#7c3aed", "#c4b5fd,#8b5cf6", "#a78bfa,#4c1d95"][index]
            })`,
            boxShadow: `0 0 20px rgba(139,92,246,0.8), 0 0 40px rgba(139,92,246,0.4), 0 0 80px rgba(139,92,246,0.2)`,
            position: "relative",
            transition: "height 0.1s",
          }}
        >
          {/* Shine highlight */}
          <div
            style={{
              position: "absolute",
              top: 4,
              left: 6,
              width: 16,
              height: "60%",
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)",
              borderRadius: 8,
            }}
          />
        </div>
      </div>
      <span
        style={{
          color: "#a5b4fc",
          fontSize: 18,
          fontWeight: 600,
          fontFamily: "sans-serif",
          textShadow: "0 0 10px rgba(165,180,252,0.6)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function CounterDisplay({ frame, fps }: { frame: number; fps: number }) {
  const counterStart = 20;

  const progress = spring({
    fps,
    frame: Math.max(0, frame - counterStart),
    config: { damping: 18, stiffness: 60, mass: 1 },
    durationInFrames: 80,
  });

  const currentValue = Math.round(progress * 78);

  const glowIntensity = interpolate(progress, [0, 0.5, 1], [0.3, 1, 0.8]);

  const fadeIn = interpolate(frame, [counterStart, counterStart + 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        opacity: fadeIn,
      }}
    >
      {/* Label */}
      <div
        style={{
          fontSize: 22,
          fontWeight: 500,
          color: "#c4b5fd",
          fontFamily: "sans-serif",
          letterSpacing: 3,
          textTransform: "uppercase",
          textShadow: "0 0 12px rgba(196,181,253,0.6)",
        }}
      >
        Growth Rate
      </div>

      {/* Counter */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "baseline",
          gap: 4,
        }}
      >
        {/* Outer glow ring */}
        <div
          style={{
            position: "absolute",
            inset: -30,
            borderRadius: "50%",
            background: `radial-gradient(ellipse, rgba(139,92,246,${glowIntensity * 0.4}) 0%, transparent 70%)`,
            filter: "blur(20px)",
          }}
        />
        <span
          style={{
            fontSize: 120,
            fontWeight: 800,
            fontFamily: "sans-serif",
            lineHeight: 1,
            color: "#ffffff",
            textShadow: `
              0 0 20px rgba(167,139,250,${glowIntensity}),
              0 0 40px rgba(139,92,246,${glowIntensity * 0.8}),
              0 0 80px rgba(124,58,237,${glowIntensity * 0.6}),
              0 0 120px rgba(109,40,217,${glowIntensity * 0.4})
            `,
          }}
        >
          {currentValue}
        </span>
        <span
          style={{
            fontSize: 56,
            fontWeight: 700,
            fontFamily: "sans-serif",
            color: "#a78bfa",
            textShadow: `0 0 20px rgba(167,139,250,${glowIntensity}), 0 0 40px rgba(139,92,246,0.6)`,
            marginBottom: 8,
          }}
        >
          %
        </span>
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontSize: 18,
          color: "#7c3aed",
          fontFamily: "sans-serif",
          letterSpacing: 2,
          textShadow: "0 0 8px rgba(124,58,237,0.8)",
        }}
      >
        Year over Year
      </div>

      {/* Progress arc indicator */}
      <svg width="200" height="8" style={{ marginTop: 8 }}>
        <rect x="0" y="0" width="200" height="8" rx="4" fill="rgba(255,255,255,0.1)" />
        <rect
          x="0"
          y="0"
          width={progress * 200 * 0.78}
          height="8"
          rx="4"
          fill="url(#progressGrad)"
          style={{
            filter: `drop-shadow(0 0 6px rgba(139,92,246,${glowIntensity}))`,
          }}
        />
        <defs>
          <linearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export function ChartVideo() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0a0014 0%, #0d0030 50%, #0a0014 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: bgOpacity,
      }}
    >
      <GlowFilter />

      {/* Ambient background glow */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(124,58,237,0.15) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          filter: "blur(40px)",
        }}
      />

      {/* Main content row */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 80,
          paddingBottom: 60,
        }}
      >
        {/* Chart section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: "#c4b5fd",
              fontFamily: "sans-serif",
              letterSpacing: 2,
              textTransform: "uppercase",
              textShadow: "0 0 12px rgba(196,181,253,0.5)",
              marginBottom: 8,
            }}
          >
            Quarterly Performance
          </div>

          {/* Bars */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-end",
              gap: 24,
              padding: "0 20px",
              borderBottom: "2px solid rgba(139,92,246,0.3)",
              paddingBottom: 16,
              position: "relative",
            }}
          >
            {/* Grid lines */}
            {[0.25, 0.5, 0.75, 1].map((pct) => (
              <div
                key={pct}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 16 + pct * MAX_BAR_HEIGHT,
                  height: 1,
                  background: "rgba(139,92,246,0.15)",
                }}
              />
            ))}

            {BAR_DATA.map((bar, i) => (
              <AnimatedBar
                key={bar.label}
                value={bar.value}
                index={i}
                label={bar.label}
                frame={frame}
                fps={fps}
              />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            width: 2,
            height: 380,
            background:
              "linear-gradient(to bottom, transparent, rgba(139,92,246,0.6), transparent)",
            boxShadow: "0 0 12px rgba(139,92,246,0.4)",
            marginBottom: 60,
          }}
        />

        {/* Counter section */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 60,
          }}
        >
          <CounterDisplay frame={frame} fps={fps} />
        </div>
      </div>
    </AbsoluteFill>
  );
}
