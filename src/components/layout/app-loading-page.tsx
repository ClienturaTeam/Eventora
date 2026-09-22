import { useState, useEffect } from "react";
import { ClienturaLogo } from "@/components/ds/clientura-logo";
import { AuraLoader } from "@/components/ds/aura-loader";
import { Sparkles, Trophy, Users, Award, ShieldCheck, CheckCircle2 } from "lucide-react";

interface AppLoadingPageProps {
  message?: string;
}

const FLOW_STEPS = [
  { id: "proposals", title: "1. Proposals & Approvals", icon: Sparkles, color: "text-amber-400" },
  { id: "events", title: "2. Event & Competition Engine", icon: Trophy, color: "text-blue-400" },
  { id: "participants", title: "3. Participant & QR Check-in Hub", icon: Users, color: "text-indigo-400" },
  { id: "evaluations", title: "4. Live Scoring & Leaderboards", icon: ShieldCheck, color: "text-purple-400" },
  { id: "certificates", title: "5. Certificates & Compliance", icon: Award, color: "text-emerald-400" },
];

export function AppLoadingPage({ message = "Initializing workspace..." }: AppLoadingPageProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 98;
        return prev + 25;
      });
      setActiveStep((prev) => (prev + 1) % FLOW_STEPS.length);
    }, 250);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#070a14] text-slate-100 overflow-hidden font-sans select-none">
      {/* Subtle glowing ambient background orbs */}
      <div className="absolute top-1/4 -left-20 h-96 w-96 rounded-full bg-blue-600/15 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 h-96 w-96 rounded-full bg-indigo-600/15 blur-[120px] pointer-events-none animate-pulse" />

      <div className="relative z-10 w-full max-w-lg px-6 flex flex-col items-center text-center space-y-7">
        {/* Rotating Aura Loader Animation */}
        <AuraLoader size="lg" />

        {/* Clientura Logo Branding */}
        <div className="pt-1">
          <ClienturaLogo size="lg" variant="dark" />
        </div>

        {/* Progress Bar Container */}
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
            <span className="flex items-center gap-1.5 text-blue-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping inline-block" />
              {message}
            </span>
            <span>{progress}%</span>
          </div>

          <div className="relative h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(99,102,241,0.6)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Application Flow Blueprint (Landing Page Flow) */}
        <div className="w-full bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 backdrop-blur-md space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1.5">
            <span>Eventora Platform Flow</span>
          </p>

          <div className="grid grid-cols-1 gap-2 text-left">
            {FLOW_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = idx === activeStep;
              const isPast = idx < activeStep;

              return (
                <div
                  key={step.id}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all duration-300 ${
                    isActive
                      ? "bg-slate-800/80 border-blue-500/50 text-white shadow-md shadow-blue-500/10 scale-[1.01]"
                      : isPast
                      ? "bg-slate-950/40 border-slate-800/40 text-slate-400 opacity-80"
                      : "bg-slate-950/20 border-transparent text-slate-500"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${step.color}`} />
                    <span className="font-medium">{step.title}</span>
                  </div>
                  {isPast ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  ) : isActive ? (
                    <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-[11px] text-slate-500">
          Powered by Clientura Enterprise Architecture
        </p>
      </div>
    </div>
  );
}
