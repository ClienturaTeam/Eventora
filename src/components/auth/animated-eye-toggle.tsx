import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

interface AnimatedEyeToggleProps {
  isOpen: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function AnimatedEyeToggle({
  isOpen,
  onToggle,
  disabled = false,
}: AnimatedEyeToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      tabIndex={-1}
      aria-label={isOpen ? "Hide password" : "Show password"}
      title={isOpen ? "Hide password (mascot covers eyes)" : "Show password (mascot peeks)"}
      className="relative flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isOpen ? (
          <motion.div
            key="eye-open"
            initial={{ scale: 0.5, rotate: -30, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.5, rotate: 30, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex items-center justify-center text-primary"
          >
            <Eye className="h-4 w-4 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
          </motion.div>
        ) : (
          <motion.div
            key="eye-off"
            initial={{ scale: 0.5, rotate: 30, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.5, rotate: -30, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex items-center justify-center"
          >
            <EyeOff className="h-4 w-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
