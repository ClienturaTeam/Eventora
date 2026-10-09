import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { fetchApi, ApiError } from "@/lib/api-client";
import {
  User,
  Mail,
  Phone,
  Lock,
  Sparkles,
  ArrowRight,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Users,
  GraduationCap,
  Gavel,
} from "lucide-react";
import { ClienturaLogo } from "@/components/ds/clientura-logo";
import { InteractiveMascot } from "@/components/auth/interactive-mascot";
import { AnimatedEyeToggle } from "@/components/auth/animated-eye-toggle";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create Account · Eventora" },
      { name: "description", content: "Create an enterprise account on Eventora." },
    ],
  }),
  component: SignupPage,
});

const signupSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().trim().toLowerCase().email("Please enter a valid email address"),
    mobileNumber: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^\d{10}$/.test(val.trim()),
        "Phone number must contain exactly 10 digits"
      ),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    confirmPassword: z.string().min(8, "Password confirmation is required"),
    role: z.enum(["Participant", "Student Coordinator", "Faculty Coordinator", "Judge"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Mascot and password visibility state
  const [focusState, setFocusState] = useState<"idle" | "email" | "password">("idle");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      mobileNumber: "",
      password: "",
      confirmPassword: "",
      role: "Participant",
    },
  });

  const emailValue = watch("email") || "";
  const selectedRole = watch("role") || "Participant";

  const onSubmit = async (data: SignupFormValues) => {
    try {
      setIsLoading(true);

      const res = await fetchApi("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: data.email.trim().toLowerCase(),
          password: data.password,
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          mobileNumber: data.mobileNumber?.trim() || undefined,
          role: data.role || "Participant",
        }),
      });

      if (res.success) {
        if (data.role === "Faculty Coordinator") {
          toast.success(
            "Your Faculty Coordinator request has been submitted. A Manager will review your request."
          );
        } else {
          toast.success("Account created successfully! Please sign in.");
        }
        router.navigate({ to: "/login" });
      } else {
        toast.error(res.error?.message || "Failed to create account. Please try again.");
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || "Failed to create account. Please check your details.");
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    {
      value: "Participant" as const,
      title: "Participant",
      desc: "Register for events and compete in hackathons",
      icon: Users,
    },
    {
      value: "Student Coordinator" as const,
      title: "Student Coordinator",
      desc: "Manage attendees when assigned by faculty",
      icon: CheckCircle2,
    },
    {
      value: "Faculty Coordinator" as const,
      title: "Faculty Coordinator",
      desc: "Oversee operations (requires manager approval)",
      icon: GraduationCap,
    },
    {
      value: "Judge" as const,
      title: "Judge / Evaluator",
      desc: "Grade submissions and submit scorecards",
      icon: Gavel,
    },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-[#070b14] overflow-x-hidden selection:bg-blue-500/30 selection:text-white px-4 relative py-12">
      {/* Immersive Ambient Glow & Dot Matrix Grid Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
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
        <Link to="/" className="flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/40 hover:bg-slate-900/80 transition-colors">
          <ClienturaLogo size="md" variant="dark" />
        </Link>

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

      {/* Center Auth Card with Interactive Mascot */}
      <main className="relative z-10 w-full max-w-[480px] my-auto pt-16 pb-8">
        {/* Interactive Mascot Peeking over the Card Board */}
        <InteractiveMascot
          focusState={focusState}
          showPassword={showPassword || showConfirmPassword}
          emailLength={emailValue.length}
        />

        {/* The Card Board - Matching Sign In Board Exactly */}
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
              Create an Account
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto">
              Join the platform to participate, evaluate, or manage enterprise hackathons.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* First Name & Last Name (2-Column) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="firstName"
                  className="block text-xs font-medium text-slate-300 tracking-wide"
                >
                  First Name *
                </label>
                <div
                  className={`group relative flex items-center rounded-xl bg-slate-950/70 border transition-all duration-200 ${
                    errors.firstName
                      ? "border-rose-500/80 ring-2 ring-rose-500/20"
                      : "border-slate-800 hover:border-slate-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/25"
                  }`}
                >
                  <User className="absolute left-3.5 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors pointer-events-none" />
                  <input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    disabled={isLoading}
                    {...register("firstName")}
                    onFocus={() => setFocusState("email")}
                    onBlur={() => setFocusState("idle")}
                    className="w-full bg-transparent pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none disabled:opacity-50"
                  />
                </div>
                {errors.firstName && (
                  <p className="text-xs font-medium text-rose-400 pt-0.5">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="lastName"
                  className="block text-xs font-medium text-slate-300 tracking-wide"
                >
                  Last Name *
                </label>
                <div
                  className={`group relative flex items-center rounded-xl bg-slate-950/70 border transition-all duration-200 ${
                    errors.lastName
                      ? "border-rose-500/80 ring-2 ring-rose-500/20"
                      : "border-slate-800 hover:border-slate-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/25"
                  }`}
                >
                  <User className="absolute left-3.5 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors pointer-events-none" />
                  <input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    disabled={isLoading}
                    {...register("lastName")}
                    onFocus={() => setFocusState("email")}
                    onBlur={() => setFocusState("idle")}
                    className="w-full bg-transparent pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none disabled:opacity-50"
                  />
                </div>
                {errors.lastName && (
                  <p className="text-xs font-medium text-rose-400 pt-0.5">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-medium text-slate-300 tracking-wide"
              >
                Email Address *
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

            {/* Mobile Number (Optional) */}
            <div className="space-y-1.5">
              <label
                htmlFor="mobileNumber"
                className="block text-xs font-medium text-slate-300 tracking-wide"
              >
                Mobile Number <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <div
                className={`group relative flex items-center rounded-xl bg-slate-950/70 border transition-all duration-200 ${
                  errors.mobileNumber
                    ? "border-rose-500/80 ring-2 ring-rose-500/20"
                    : "border-slate-800 hover:border-slate-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/25"
                }`}
              >
                <Phone className="absolute left-3.5 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors pointer-events-none" />
                <input
                  id="mobileNumber"
                  type="tel"
                  placeholder="9876543210"
                  disabled={isLoading}
                  {...register("mobileNumber")}
                  className="w-full bg-transparent pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none disabled:opacity-50"
                />
              </div>
              {errors.mobileNumber && (
                <p className="text-xs font-medium text-rose-400 pt-0.5">
                  {errors.mobileNumber.message}
                </p>
              )}
            </div>

            {/* Password with Animated Eye Toggle */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-medium text-slate-300 tracking-wide"
              >
                Password *
              </label>
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
                  autoComplete="new-password"
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

            {/* Confirm Password with Animated Eye Toggle */}
            <div className="space-y-1.5">
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-medium text-slate-300 tracking-wide"
              >
                Confirm Password *
              </label>
              <div
                className={`group relative flex items-center rounded-xl bg-slate-950/70 border transition-all duration-200 ${
                  errors.confirmPassword
                    ? "border-rose-500/80 ring-2 ring-rose-500/20"
                    : "border-slate-800 hover:border-slate-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/25"
                }`}
              >
                <Lock className="absolute left-3.5 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors pointer-events-none" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  autoComplete="new-password"
                  disabled={isLoading}
                  {...register("confirmPassword")}
                  onFocus={() => setFocusState("password")}
                  onBlur={() => setFocusState("idle")}
                  className="w-full bg-transparent pl-10 pr-11 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none disabled:opacity-50"
                />
                <div className="absolute right-2">
                  <AnimatedEyeToggle
                    isOpen={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword((prev) => !prev)}
                    disabled={isLoading}
                  />
                </div>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs font-medium text-rose-400 pt-0.5">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Account Type Selection (Dark Glass Cards) */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-medium text-slate-300 tracking-wide">
                Choose Account Type
              </label>
              <div className="grid grid-cols-1 gap-2">
                {roleOptions.map((opt) => {
                  const isSelected = selectedRole === opt.value;
                  const Icon = opt.icon;
                  return (
                    <label
                      key={opt.value}
                      onClick={() => setValue("role", opt.value)}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "border-blue-500/80 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.18)]"
                          : "border-slate-800/80 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-900/50"
                      }`}
                    >
                      <input
                        type="radio"
                        value={opt.value}
                        checked={isSelected}
                        onChange={() => setValue("role", opt.value)}
                        className="sr-only"
                      />
                      <div
                        className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          isSelected
                            ? "bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                            : "bg-slate-800/80 text-slate-400"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-semibold ${isSelected ? "text-white" : "text-slate-300"}`}>
                            {opt.title}
                          </p>
                          {isSelected && (
                            <span className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400/90 mt-0.5 leading-snug">
                          {opt.desc}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
              {errors.role && (
                <p className="text-xs font-medium text-rose-400 pt-0.5">
                  {errors.role.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full mt-3 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] transition-all duration-200 shadow-[0_0_25px_rgba(59,130,246,0.35)] hover:shadow-[0_0_35px_rgba(59,130,246,0.55)] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 overflow-hidden cursor-pointer"
            >
              {/* Subtle shine hover effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform" />

              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer - Switch back to Sign In */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center space-y-2">
            <p className="text-xs text-slate-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-blue-400 hover:text-blue-300 transition-colors hover:underline"
              >
                Sign in to Account
              </Link>
            </p>
            <p className="text-[10px] text-slate-500">
              By creating an account, you agree to our terms and privacy protocols.
            </p>
          </div>
        </div>

        {/* Bottom Micro Copy */}
        <p className="text-center text-[11px] text-slate-500 mt-6 tracking-wide">
          Protected by Enterprise-grade Zero-Trust Authentication
        </p>
      </main>
    </div>
  );
}
