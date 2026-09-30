import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface InteractiveMascotProps {
  focusState: "idle" | "email" | "password";
  showPassword?: boolean;
  emailLength?: number;
}

export function InteractiveMascot({
  focusState,
  showPassword = false,
  emailLength = 0,
}: InteractiveMascotProps) {
  const [isBlinking, setIsBlinking] = useState(false);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  // Natural blinking effect when idle or typing email
  useEffect(() => {
    if (focusState === "password" && !showPassword) return;

    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 160);
    }, 3600);

    return () => clearInterval(interval);
  }, [focusState, showPassword]);

  // Subtle mouse tracking when idle
  useEffect(() => {
    if (focusState !== "idle") return;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 2; // -1 to 1
      const y = (e.clientY / innerHeight - 0.5) * 2;
      setMouseOffset({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [focusState]);

  // Calculate eye pupil coordinates
  let pupilX = 0;
  let pupilY = 0;

  if (focusState === "email") {
    // Look down and track typing progress across the input
    const maxChars = 28;
    const normalizedProgress = Math.min(Math.max(emailLength / maxChars, 0), 1);
    pupilX = (normalizedProgress - 0.5) * 9; // Range: -4.5 to +4.5
    pupilY = 4.2; // Look down towards email box
  } else if (focusState === "password") {
    if (showPassword) {
      // Peeking look: eye looks slightly to the right with curiosity
      pupilX = 4.5;
      pupilY = 1.5;
    } else {
      // Eyes covered
      pupilX = 0;
      pupilY = 0;
    }
  } else {
    // Idle tracking mouse subtly
    pupilX = mouseOffset.x * 4;
    pupilY = mouseOffset.y * 3;
  }

  const isEyesCovered = focusState === "password" && !showPassword;
  const isPeeking = focusState === "password" && showPassword;

  return (
    <div className="relative flex items-center justify-center -mb-7 z-20 select-none pointer-events-none">
      <div className="relative w-36 h-28 drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)]">
        <svg
          viewBox="0 0 160 120"
          className="w-full h-full overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Mascot Body Gradient */}
            <linearGradient id="mascotBody" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            {/* Glowing Rim Gradient */}
            <linearGradient id="rimGlow" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#6366f1" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
            </linearGradient>

            {/* Iris Gradient */}
            <radialGradient id="irisGrad" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="65%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </radialGradient>

            {/* Paw Gradient */}
            <linearGradient id="pawGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            {/* Cyan Accent Glow */}
            <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Ears / Antennas */}
          {/* Left Ear */}
          <path
            d="M 38 42 L 24 16 C 22 13 26 9 30 12 L 48 35 Z"
            fill="#1e293b"
            stroke="#38bdf8"
            strokeWidth="1.2"
            strokeOpacity="0.6"
          />
          <circle cx="25" cy="14" r="2.5" fill="#38bdf8" filter="url(#cyanGlow)" />

          {/* Right Ear */}
          <path
            d="M 122 42 L 136 16 C 138 13 134 9 130 12 L 112 35 Z"
            fill="#1e293b"
            stroke="#38bdf8"
            strokeWidth="1.2"
            strokeOpacity="0.6"
          />
          <circle cx="135" cy="14" r="2.5" fill="#38bdf8" filter="url(#cyanGlow)" />

          {/* Head & Body */}
          <rect
            x="26"
            y="24"
            width="108"
            height="90"
            rx="38"
            fill="url(#mascotBody)"
            stroke="url(#rimGlow)"
            strokeWidth="1.6"
          />

          {/* Visor Area (Dark Glass Backing for Eyes) */}
          <rect
            x="36"
            y="34"
            width="88"
            height="50"
            rx="22"
            fill="#090d16"
            stroke="#1e293b"
            strokeWidth="1"
          />

          {/* Cheeks (Blush) */}
          <ellipse
            cx="44"
            cy="70"
            rx="6"
            ry="3.5"
            fill="#f43f5e"
            opacity={isEyesCovered ? 0.45 : 0.25}
            className="transition-opacity duration-300"
          />
          <ellipse
            cx="116"
            cy="70"
            rx="6"
            ry="3.5"
            fill="#f43f5e"
            opacity={isEyesCovered ? 0.45 : 0.25}
            className="transition-opacity duration-300"
          />

          {/* ================= LEFT EYE ================= */}
          <g>
            {/* Left Eye Sclera (White) */}
            <ellipse
              cx="60"
              cy="56"
              rx="14"
              ry={isBlinking && !isEyesCovered ? 1.5 : 15}
              fill="#f8fafc"
              className="transition-all duration-100 ease-out"
            />

            {/* Left Pupil + Iris */}
            {(!isBlinking || isEyesCovered) && (
              <motion.g
                animate={{
                  x: pupilX,
                  y: pupilY,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 24,
                }}
              >
                {/* Iris */}
                <ellipse cx="60" cy="56" rx="8" ry="9" fill="url(#irisGrad)" />
                {/* Pupil */}
                <circle cx="60" cy="56" r="5" fill="#090d16" />
                {/* Specular Glints */}
                <circle cx="62.5" cy="53.5" r="2.2" fill="#ffffff" />
                <circle cx="58" cy="58.5" r="1.1" fill="#ffffff" opacity="0.8" />
              </motion.g>
            )}
          </g>

          {/* ================= RIGHT EYE ================= */}
          <g>
            {/* Right Eye Sclera (White) */}
            <ellipse
              cx="100"
              cy="56"
              rx="14"
              ry={isBlinking && !isEyesCovered ? 1.5 : 15}
              fill="#f8fafc"
              className="transition-all duration-100 ease-out"
            />

            {/* Right Pupil + Iris */}
            {(!isBlinking || isEyesCovered) && (
              <motion.g
                animate={{
                  x: pupilX,
                  y: pupilY,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 24,
                }}
              >
                {/* Iris */}
                <ellipse cx="100" cy="56" rx="8" ry="9" fill="url(#irisGrad)" />
                {/* Pupil */}
                <circle cx="100" cy="56" r="5" fill="#090d16" />
                {/* Specular Glints */}
                <circle cx="102.5" cy="53.5" r="2.2" fill="#ffffff" />
                <circle cx="98" cy="58.5" r="1.1" fill="#ffffff" opacity="0.8" />
              </motion.g>
            )}
          </g>

          {/* Mouth / Smile */}
          <motion.path
            animate={{
              d: isEyesCovered
                ? "M 74 74 Q 80 72 86 74" // shy flat line
                : isPeeking
                ? "M 73 72 Q 80 80 87 72" // cheerful open grin
                : focusState === "email"
                ? "M 74 72 Q 80 78 86 72" // focused smile
                : "M 75 73 Q 80 76 85 73", // gentle rest smile
            }}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2.2"
            strokeLinecap="round"
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          />

          {/* ================= HANDS / PAWS ================= */}
          {/* LEFT HAND */}
          <motion.g
            animate={
              isEyesCovered
                ? { x: 12, y: -26, rotate: -6 } // Completely covering left eye
                : isPeeking
                ? { x: 4, y: -16, rotate: -12 } // Partially covering left eye
                : { x: 0, y: 0, rotate: 0 } // Resting at bottom ledge
            }
            transition={{
              type: "spring",
              stiffness: 280,
              damping: 22,
            }}
          >
            {/* Left Paw Outer Shape */}
            <rect
              x="36"
              y="86"
              width="30"
              height="26"
              rx="12"
              fill="url(#pawGrad)"
              stroke="#38bdf8"
              strokeWidth="1.2"
              strokeOpacity="0.7"
            />
            {/* Cyber Pad Lights on Paw */}
            <circle cx="51" cy="98" r="4.5" fill="#0284c7" opacity="0.8" />
            <circle cx="44" cy="93" r="2" fill="#38bdf8" />
            <circle cx="51" cy="91" r="2" fill="#38bdf8" />
            <circle cx="58" cy="93" r="2" fill="#38bdf8" />
          </motion.g>

          {/* RIGHT HAND */}
          <motion.g
            animate={
              isEyesCovered
                ? { x: -12, y: -26, rotate: 6 } // Completely covering right eye
                : isPeeking
                ? { x: 8, y: 6, rotate: 18 } // PEEKING! Hand drops down and tilts so right eye peeks through!
                : { x: 0, y: 0, rotate: 0 } // Resting at bottom ledge
            }
            transition={{
              type: "spring",
              stiffness: 280,
              damping: 22,
            }}
          >
            {/* Right Paw Outer Shape */}
            <rect
              x="94"
              y="86"
              width="30"
              height="26"
              rx="12"
              fill="url(#pawGrad)"
              stroke="#38bdf8"
              strokeWidth="1.2"
              strokeOpacity="0.7"
            />
            {/* Cyber Pad Lights on Paw */}
            <circle cx="109" cy="98" r="4.5" fill="#0284c7" opacity="0.8" />
            <circle cx="102" cy="93" r="2" fill="#38bdf8" />
            <circle cx="109" cy="91" r="2" fill="#38bdf8" />
            <circle cx="116" cy="93" r="2" fill="#38bdf8" />
          </motion.g>

          {/* Desk / Card Ledge Highlight where mascot rests */}
          <path
            d="M 20 112 L 140 112"
            stroke="url(#rimGlow)"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
          />
        </svg>
      </div>
    </div>
  );
}
