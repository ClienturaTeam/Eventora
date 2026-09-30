import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/auth";
import { fetchApi, ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import {
  Mail,
  Lock,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Loader2,
  KeyRound,
  Shield,
  CheckCircle2,
} from "lucide-react";
import { ClienturaLogo } from "@/components/ds/clientura-logo";
import { InteractiveMascot } from "@/components/auth/interactive-mascot";
import { AnimatedEyeToggle } from "@/components/auth/animated-eye-toggle";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const mfaSchema = z.object({
  code: z.string().min(6, "Code must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type MfaFormValues = z.infer<typeof mfaSchema>;

function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [mfaChallenge, setMfaChallenge] = useState<{ challengeToken: string } | null>(null);

  // Interactive Mascot & Eye animation state
  const [focusState, setFocusState] = useState<"idle" | "email" | "password">("idle");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "manager@contoso.com",
      password: "Password123!",
    },
  });

  const emailValue = watch("email") || "";

  const {
    register: registerMfa,
    handleSubmit: handleMfaSubmit,
    formState: { errors: mfaErrors },
  } = useForm<MfaFormValues>({
    resolver: zodResolver(mfaSchema),
  });

  const handleRedirect = (user: any) => {
    if (!user || !user.memberships || user.memberships.length === 0) {
      router.navigate({ to: "/participant" });
      return;
    }
    const roleName = user.memberships[0]?.role?.name;
    const memberStatus = user.memberships[0]?.status;

    if (memberStatus === "PENDING") {
      router.navigate({ to: "/pending-approval" });
      return;
    }

    if (roleName === "Sudo Admin" || roleName === "Platform Admin") {
      router.navigate({ to: "/platform-admin" });
    } else if (roleName === "Admin" || roleName === "Organization Admin" || roleName === "Manager") {
      router.navigate({ to: "/manager" });
    } else if (roleName === "Faculty Coordinator") {
      router.navigate({ to: "/faculty-coordinator" });
    } else if (roleName === "Student Coordinator") {
      router.navigate({ to: "/coordinator" });
    } else if (roleName === "Participant" || roleName === "STUDENT" || roleName === "Student") {
      router.navigate({ to: "/participant" });
    } else if (roleName === "Judge") {
      router.navigate({ to: "/evaluations" });
    } else if (roleName === "Mentor") {
      router.navigate({ to: "/teams" });
    } else if (roleName === "Volunteer") {
      router.navigate({ to: "/volunteers" });
    } else {
      router.navigate({ to: "/participant" });
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      const cleanData = {
        ...data,
        email: data.email.trim().toLowerCase(),
      };
      const res = await fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify(cleanData),
      });

      if (res.success && res.data?.mfaRequired) {
        setMfaChallenge({ challengeToken: res.data.challengeToken });
        return;
      }

      if (res.success && res.data?.token) {
        login(res.data.token);
        toast.success("Successfully logged in!");
        handleRedirect(res.data.user);
      } else {
        toast.error("Invalid response from server.");
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || "Failed to log in. Please check your credentials.");
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onMfaSubmit = async (data: MfaFormValues) => {
    if (!mfaChallenge) return;
    try {
      setIsLoading(true);
      const res = await fetchApi("/auth/mfa/verify", {
        method: "POST",
        body: JSON.stringify({
          challengeToken: mfaChallenge.challengeToken,
          code: data.code,
        }),
      });

      if (res.success && res.data?.token) {
        login(res.data.token);
        toast.success("Successfully logged in!");
        handleRedirect(res.data.user);
      } else {
        toast.error("Invalid response from server.");
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || "Invalid MFA code.");
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = (role: "manager" | "participant") => {
    if (role === "manager") {
      setValue("email", "manager@contoso.com", { shouldValidate: true });
      setValue("password", "Password123!", { shouldValidate: true });
      toast.info("Manager credentials auto-filled");
    } else {
      setValue("email", "participant@gmail.com", { shouldValidate: true });
      setValue("password", "Password123!", { shouldValidate: true });
      toast.info("Participant credentials auto-filled");
    }
    setFocusState("idle");
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-[#070b14] selection:bg-primary/30 selection:text-white">
      {/* Background Ambient Glow & Grid System */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Glowing Orbs */}
        <div className="absolute -top-40 -left-40 w-[550px] h-[550px] rounded-full bg-blue-600/15 blur-[130px] animate-pulse duration-1000" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-indigo-600/15 blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full bg-cyan-500/8 blur-[150px]" />

        {/* Fine Geometric Dot Grid Pattern */}
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.15) 1px, transparent 0)`,
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          }}
        />
      </div>

      {/* Top Floating Header */}
      <header className="absolute top-6 left-6 right-6 flex items-center justify-between pointer-events-auto z-20">
        <div className="flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/40">
          <ClienturaLogo size="md" variant="dark" />
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/60 backdrop-blur-xl border border-white/10 text-xs font-medium text-slate-300 shadow-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-slate-400">Enterprise Event Cloud</span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400 font-semibold">Active</span>
        </div>
      </header>

      {/* Center Auth Card with Interactive Eye Mascot */}
      <main className="relative z-10 w-full max-w-[430px] my-auto pt-14 pb-8">
        {/* Interactive Eye Mascot */}
        <InteractiveMascot
          focusState={focusState}
          showPassword={showPassword}
          emailLength={emailValue.length}
        />

        {/* The Card Board */}
        <div className="relative rounded-3xl bg-slate-900/75 backdrop-blur-2xl border border-white/12 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),0_0_40px_-10px_rgba(59,130,246,0.18)] p-6 sm:p-8 transition-all duration-300">
          {/* Subtle Top Border Glow Line */}
          <div className="absolute inset-x-8 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent pointer-events-none" />

          {/* Card Title & Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>SECURE ACCESS PORTAL</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-br from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              {mfaChallenge ? "Two-Factor Security" : "Welcome back"}
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto">
              {mfaChallenge
                ? "Enter the 6-digit verification code from your authenticator app."
                : "Sign in to manage and participate in enterprise events."}
            </p>
          </div>

          {!mfaChallenge ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-xs font-medium text-slate-300 tracking-wide"
                >
                  Email Address
                </label>
                <div
                  className={`group relative flex items-center rounded-xl bg-slate-950/70 border transition-all duration-200 ${
                    errors.email
                      ? "border-rose-500/80 ring-2 ring-rose-500/20"
                      : "border-slate-800 hover:border-slate-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/25"
                  }`}
                >
                  <Mail className="absolute left-3.5 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    autoComplete="email"
                    disabled={isLoading}
                    {...register("email")}
                    onFocus={() => setFocusState("email")}
                    onBlur={() => setFocusState("idle")}
                    className="w-full bg-transparent pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none disabled:opacity-50"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs font-medium text-rose-400 pt-0.5">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Input with Eye Animation Toggle */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-medium text-slate-300 tracking-wide"
                  >
                    Password
                  </label>
                  <span className="text-[11px] text-slate-400 hover:text-blue-400 transition-colors cursor-pointer">
                    Forgot password?
                  </span>
                </div>
                <div
                  className={`group relative flex items-center rounded-xl bg-slate-950/70 border transition-all duration-200 ${
                    errors.password
                      ? "border-rose-500/80 ring-2 ring-rose-500/20"
                      : "border-slate-800 hover:border-slate-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/25"
                  }`}
                >
                  <Lock className="absolute left-3.5 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    disabled={isLoading}
                    {...register("password")}
                    onFocus={() => setFocusState("password")}
                    onBlur={() => setFocusState("idle")}
                    className="w-full bg-transparent pl-10 pr-11 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none disabled:opacity-50"
                  />
                  <div className="absolute right-2">
                    <AnimatedEyeToggle
                      isOpen={showPassword}
                      onToggle={() => setShowPassword((prev) => !prev)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                {errors.password && (
                  <p className="text-xs font-medium text-rose-400 pt-0.5">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full mt-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] transition-all duration-200 shadow-[0_0_25px_rgba(59,130,246,0.35)] hover:shadow-[0_0_35px_rgba(59,130,246,0.55)] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 overflow-hidden"
              >
                {/* Subtle shine hover effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform" />

                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in to Account</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>

              {/* Quick Demo Fast-Track Section */}
              <div className="pt-3">
                <div className="relative flex items-center justify-center my-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800" />
                  </div>
                  <span className="relative px-3 bg-slate-900/90 text-[11px] font-medium uppercase tracking-wider text-slate-400 rounded-full border border-slate-800/80">
                    Fast-Track Demo Access
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleDemoFill("manager")}
                    className="group relative flex flex-col items-start p-2.5 rounded-xl bg-slate-950/50 hover:bg-blue-950/30 border border-slate-800/80 hover:border-blue-500/40 transition-all text-left"
                  >
                    <div className="flex items-center gap-1.5 w-full">
                      <div className="p-1 rounded-md bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 group-hover:text-blue-300 transition-colors">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                        Manager
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 group-hover:text-slate-400 mt-1 line-clamp-1">
                      Full control & analytics
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoFill("participant")}
                    className="group relative flex flex-col items-start p-2.5 rounded-xl bg-slate-950/50 hover:bg-indigo-950/30 border border-slate-800/80 hover:border-indigo-500/40 transition-all text-left"
                  >
                    <div className="flex items-center gap-1.5 w-full">
                      <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 transition-colors">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                        Participant
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 group-hover:text-slate-400 mt-1 line-clamp-1">
                      Live event attendee
                    </span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* MFA Verification Form */
            <form onSubmit={handleMfaSubmit(onMfaSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="code"
                  className="block text-xs font-medium text-slate-300 tracking-wide"
                >
                  Authenticator Code
                </label>
                <div
                  className={`group relative flex items-center rounded-xl bg-slate-950/70 border transition-all duration-200 ${
                    mfaErrors.code
                      ? "border-rose-500/80 ring-2 ring-rose-500/20"
                      : "border-slate-800 hover:border-slate-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/25"
                  }`}
                >
                  <KeyRound className="absolute left-3.5 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors pointer-events-none" />
                  <input
                    id="code"
                    type="text"
                    placeholder="6-digit verification code"
                    autoComplete="one-time-code"
                    disabled={isLoading}
                    {...registerMfa("code")}
                    className="w-full bg-transparent pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none tracking-widest font-mono disabled:opacity-50"
                  />
                </div>
                {mfaErrors.code && (
                  <p className="text-xs font-medium text-rose-400 pt-0.5">
                    {mfaErrors.code.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_0_20px_rgba(59,130,246,0.4)] disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify & Continue</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => setMfaChallenge(null)}
                className="w-full py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel and return to login
              </button>
            </form>
          )}

          {/* Trust and Compliance Footer */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Shield className="w-3.5 h-3.5 text-blue-400/80" />
              <span>TLS 1.3 256-Bit Encryption • SOC-2 Type II Certified</span>
            </div>
            <p className="text-[11px] text-slate-500">
              By continuing, you agree to our{" "}
              <a
                href="#"
                className="text-slate-400 hover:text-blue-400 underline decoration-slate-700 underline-offset-2 transition-colors"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="#"
                className="text-slate-400 hover:text-blue-400 underline decoration-slate-700 underline-offset-2 transition-colors"
              >
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
