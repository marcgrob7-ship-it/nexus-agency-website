import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

const ACCENT = "#7c3aed";
const ACCENT_LIGHT = "#a78bfa";
const ACCENT_GLOW = "#c4b5fd";
const BAR_MAX_HEIGHT = 380;
const TARGET_PERCENT = 78;

function easeOutExpo(x: number): number {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

export const ChartCounter: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Chart bar spring: rises from 0 over ~2s
  const barProgress = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 60, mass: 0.8 },
    durationInFrames: 70,
  });

  const barHeight = barProgress * BAR_MAX_HEIGHT;

  // Counter: smooth from 0 to 78 over 90 frames
  const rawPercent = interpolate(frame, [0, 90], [0, TARGET_PERCENT], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const displayPercent = Math.round(rawPercent);

  // Glow pulse: ramps in, then gently breathes
  const glowBase = interpolate(frame, [0, 40, 60], [0, 1, 1], {
    extrapolateRight: "clamp",
  });
  const breathe =
    0.85 + 0.15 * Math.sin((frame / fps) * Math.PI * 1.2);
  const glow = glowBase * breathe;

  const barGlow = `
    0 0 ${12 * glow}px ${ACCENT},
    0 0 ${30 * glow}px ${ACCENT},
    0 0 ${60 * glow}px ${ACCENT_LIGHT},
    0 0 ${100 * glow}px ${ACCENT_GLOW}33
  `;

  const textGlow = `
    0 0 ${10 * glow}px ${ACCENT},
    0 0 ${24 * glow}px ${ACCENT_LIGHT},
    0 0 ${50 * glow}px ${ACCENT_GLOW}55
  `;

  // Bar fill: gradient that shifts as it rises
  const gradientAngle = 170 + barProgress * 20;

  // Background vignette fade-in
  const bgOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#07060f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Background radial glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 60% 50% at 50% 60%, ${ACCENT}22 0%, transparent 70%)`,
          opacity: bgOpacity,
        }}
      />

      {/* Grid lines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.06 * bgOpacity,
          backgroundImage: `
            linear-gradient(${ACCENT_LIGHT} 1px, transparent 1px),
            linear-gradient(90deg, ${ACCENT_LIGHT} 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Main content */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 120,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* ── Bar Chart ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          {/* Y-axis labels */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-end",
              gap: 16,
            }}
          >
            {/* Y-axis */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: BAR_MAX_HEIGHT,
                opacity: 0.35 * bgOpacity,
              }}
            >
              {["100%", "75%", "50%", "25%", "0%"].map((label) => (
                <span
                  key={label}
                  style={{ color: ACCENT_LIGHT, fontSize: 18, lineHeight: 1 }}
                >
                  {label}
                </span>
              ))}
            </div>

            {/* Bar container */}
            <div
              style={{
                width: 90,
                height: BAR_MAX_HEIGHT,
                position: "relative",
                display: "flex",
                alignItems: "flex-end",
              }}
            >
              {/* Track */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 10,
                  background: `${ACCENT}18`,
                  border: `1px solid ${ACCENT}33`,
                }}
              />

              {/* Filled bar */}
              <div
                style={{
                  width: "100%",
                  height: barHeight,
                  borderRadius: 10,
                  background: `linear-gradient(${gradientAngle}deg, ${ACCENT} 0%, ${ACCENT_LIGHT} 60%, #e0d7ff 100%)`,
                  boxShadow: barGlow,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Shimmer stripe */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: `linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%)`,
                    transform: `translateX(${interpolate(
                      frame,
                      [0, 150],
                      [-200, 200],
                      { extrapolateRight: "clamp" }
                    )}%)`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* X-axis label */}
          <span
            style={{
              color: ACCENT_LIGHT,
              fontSize: 20,
              opacity: 0.5,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            Growth
          </span>
        </div>

        {/* ── Percentage Counter ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 140,
              fontWeight: 900,
              lineHeight: 1,
              background: `linear-gradient(135deg, #ffffff 0%, ${ACCENT_LIGHT} 50%, ${ACCENT} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "none",
              filter: `drop-shadow(0 0 ${20 * glow}px ${ACCENT}) drop-shadow(0 0 ${40 * glow}px ${ACCENT_LIGHT})`,
              letterSpacing: -4,
            }}
          >
            {displayPercent}
            <span style={{ fontSize: 80, fontWeight: 700 }}>%</span>
          </div>
          <span
            style={{
              color: ACCENT_LIGHT,
              fontSize: 22,
              opacity: 0.55,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            Conversion Rate
          </span>
        </div>
      </div>
    </div>
  );
};
