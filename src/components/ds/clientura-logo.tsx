interface ClienturaLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  variant?: "auto" | "dark" | "light";
  className?: string;
}

export function ClienturaLogo({ size = "md", showText = true, variant = "auto", className = "" }: ClienturaLogoProps) {
  const sizeMap = {
    sm: { img: "h-7 w-7", title: "text-sm", sub: "text-[9px]" },
    md: { img: "h-9 w-9", title: "text-lg", sub: "text-[11px]" },
    lg: { img: "h-11 w-11", title: "text-2xl", sub: "text-xs" },
  };

  const currentSize = sizeMap[size];

  const titleColor =
    variant === "dark"
      ? "text-white"
      : variant === "light"
      ? "text-slate-900 font-extrabold"
      : "text-slate-900 dark:text-white font-extrabold";

  const subColor =
    variant === "dark"
      ? "text-blue-400 font-semibold"
      : variant === "light"
      ? "text-blue-600 font-semibold"
      : "text-blue-600 dark:text-blue-400 font-semibold";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/clientura-logo.png"
        alt="Clientura Logo"
        className={`${currentSize.img} object-contain rounded-lg shrink-0 shadow-md bg-white p-0.5 border border-slate-200/20`}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
      {showText && (
        <div className="flex flex-col leading-none text-left">
          <span className={`font-extrabold tracking-tight drop-shadow-sm ${titleColor} ${currentSize.title}`}>
            Eventora
          </span>
          <span className={`tracking-wide mt-0.5 ${subColor} ${currentSize.sub}`}>
            powered by Clientura
          </span>
        </div>
      )}
    </div>
  );
}
