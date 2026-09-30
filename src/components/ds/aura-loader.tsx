import React from "react";

interface AuraLoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  label?: string;
  className?: string;
}

export function AuraLoader({ size = "md", label, className = "" }: AuraLoaderProps) {
  const dimensions = {
    sm: { container: "h-12 w-12", inner: "h-10 w-10", ring: "p-0.5", icon: "h-5 w-5" },
    md: { container: "h-20 w-20", inner: "h-16 w-16", ring: "p-1", icon: "h-8 w-8" },
    lg: { container: "h-28 w-28", inner: "h-24 w-24", ring: "p-1.5", icon: "h-12 w-12" },
    xl: { container: "h-36 w-36", inner: "h-32 w-32", ring: "p-2", icon: "h-16 w-16" },
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center gap-3 select-none ${className}`}>
      <div className={`relative flex items-center justify-center ${dimensions.container}`}>
        {/* Outer Glowing Blur Aura */}
        <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,_#3b82f6_0%,_#8b5cf6_35%,_#ec4899_60%,_#f59e0b_85%,_#3b82f6_100%)] blur-xl opacity-70 animate-[spin_3s_linear_infinite]" />

        {/* Outer Sharp Rotating Gradient Ring */}
        <div className={`absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,_#3b82f6_0%,_#8b5cf6_35%,_#ec4899_60%,_#f59e0b_85%,_#3b82f6_100%)] animate-[spin_2s_linear_infinite] ${dimensions.ring}`}>
          <div className="h-full w-full rounded-full bg-[#070a14]" />
        </div>

        {/* Counter-Rotating Inner Aura Accent Ring */}
        <div className="absolute inset-1 rounded-full border border-dashed border-cyan-400/40 animate-[spin_6s_linear_infinite_reverse]" />

        {/* Center Glowing Core */}
        <div className={`relative z-10 flex items-center justify-center rounded-full bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md ${dimensions.inner}`}>
          <img
            src="/clientura-logo.png"
            alt="Rotating Aura Logo"
            className={`${dimensions.icon} object-contain rounded-md animate-pulse`}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      </div>

      {label && (
        <span className="text-xs font-mono font-medium tracking-wide text-blue-400 animate-pulse flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping inline-block" />
          {label}
        </span>
      )}
    </div>
  );
}
