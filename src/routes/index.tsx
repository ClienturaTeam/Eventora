import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Calendar,
  ClipboardList,
  Users,
  CheckCircle,
  FileText,
  Bell,
  Shield,
  LayoutDashboard,
  ArrowRight,
  ArrowDown,
  Target,
  BarChart,
  Sparkles,
  Zap,
  Award,
  Lock,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ClienturaLogo } from "@/components/ds/clientura-logo";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function getDashboardUrl(user: any) {
  if (!user || !user.memberships || user.memberships.length === 0) return "/events";
  if (user.memberships[0]?.status === "PENDING") return "/pending-approval";
  const roleName = user.memberships[0]?.role?.name;
  if (roleName === "Sudo Admin" || roleName === "Platform Admin") return "/platform-admin";
  if (roleName === "Admin" || roleName === "Organization Admin" || roleName === "Manager") return "/manager";
  if (roleName === "Student Coordinator") return "/coordinator";
  if (roleName === "Participant") return "/participant";
  if (roleName === "Judge") return "/evaluations";
  if (roleName === "Mentor") return "/teams";
  if (roleName === "Volunteer") return "/volunteers";
  return "/events";
}

const PIPELINE_STEPS = [
  { id: "1", stage: "PROPOSAL", label: "Proposal Creation", desc: "Coordinators submit event proposals", icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", badge: "Active" },
  { id: "2", stage: "REVIEW", label: "Manager Review", desc: "Department manager evaluates budget & feasibility", icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", badge: "Verified" },
  { id: "3", stage: "APPROVAL", label: "Principal Approval", desc: "Institutional leadership issues formal sign-off", icon: Shield, color: "text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/30", badge: "Approved" },
  { id: "4", stage: "SETUP", label: "Event & Competition Setup", desc: "Configure rules, hackathons, and participant capacity", icon: Calendar, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/30", badge: "Configured" },
  { id: "5", stage: "DELEGATION", label: "Coordinator Assignment", desc: "Assign lead student and faculty coordinators", icon: Users, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/30", badge: "Assigned" },
  { id: "6", stage: "EXECUTION", label: "Event Execution & QR Check-in", desc: "Live QR attendance scanning & hackathon leaderboards", icon: Target, color: "text-fuchsia-400", bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/30", badge: "Live" },
  { id: "7", stage: "REPORT", label: "AI Final Report & Credentials", desc: "Generate compliance reports and digital certificates", icon: BarChart, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30", badge: "Automated" },
];

export function LandingPage() {
  const { user, isAuthenticated } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const dashboardUrl = getDashboardUrl(user);

  return (
    <div className="min-h-screen bg-[#030712] font-sans text-slate-300 selection:bg-blue-500/30 overflow-x-hidden">
      {/* Header */}
      <header
        className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-4 transition-all duration-300 md:px-12 ${
          isScrolled
            ? "bg-[#030712]/90 shadow-2xl shadow-blue-950/20 backdrop-blur-xl border-b border-slate-800/80"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <ClienturaLogo size="lg" variant="dark" />

        <nav className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm font-medium text-slate-300 transition-colors hover:text-blue-400">
            Features
          </a>
          <a href="#pipeline" className="text-sm font-medium text-slate-300 transition-colors hover:text-blue-400">
            Event Lifecycle
          </a>
          <a href="#how-it-works" className="text-sm font-medium text-slate-300 transition-colors hover:text-blue-400">
            How It Works
          </a>
          <a href="#roles" className="text-sm font-medium text-slate-300 transition-colors hover:text-blue-400">
            Roles
          </a>
        </nav>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <Button asChild className="rounded-full bg-blue-600 px-6 font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 hover:shadow-blue-500/40">
              <Link to={dashboardUrl}>
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden font-medium text-slate-300 hover:text-white hover:bg-white/10 md:inline-flex">
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild className="rounded-full bg-blue-600 px-6 font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 hover:shadow-blue-500/40">
                <Link to="/signup">Participant Register</Link>
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-24 lg:pt-44 lg:pb-32">
        {/* Subtle Ambient Background Effects */}
        <div className="absolute top-1/4 -left-32 h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none" />
        <div className="absolute top-1/3 -right-32 h-[600px] w-[600px] rounded-full bg-purple-600/10 blur-[150px] pointer-events-none" />

        <div className="container relative mx-auto px-6 md:px-12 lg:grid lg:grid-cols-12 lg:gap-12 lg:items-center">
          {/* Hero Content Left */}
          <div className="lg:col-span-6 text-center lg:text-left space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-400 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-spin-slow" />
              <span>Eventora 2.0 · Powered by Clientura Platform</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.15]">
              Manage Every Event. <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                From Proposal to Impact.
              </span>
            </h1>

            <p className="text-lg text-slate-400 sm:text-xl max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Plan, approve, organize, execute, and report your events and hackathons from one centralized, enterprise-grade platform.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              {isAuthenticated ? (
                <Button asChild size="lg" className="h-14 rounded-full bg-blue-600 px-8 text-base font-semibold text-white shadow-xl shadow-blue-600/30 hover:bg-blue-500 hover:shadow-blue-500/50">
                  <Link to={dashboardUrl}>
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="h-14 rounded-full bg-blue-600 px-8 text-base font-semibold text-white shadow-xl shadow-blue-600/30 hover:bg-blue-500 hover:shadow-blue-500/50">
                    <Link to="/signup">Participant Register</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-14 rounded-full border-slate-700/80 bg-slate-900/60 px-8 text-base font-semibold text-white backdrop-blur-md hover:bg-slate-800 hover:text-white">
                    <Link to="/login">Sign In</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Metrics Bar */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80 text-left">
              <div>
                <p className="text-2xl font-bold text-white">100+</p>
                <p className="text-xs text-slate-400">Events Managed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">15,000+</p>
                <p className="text-xs text-slate-400">Active Participants</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">100%</p>
                <p className="text-xs text-slate-400">Audit Compliance</p>
              </div>
            </div>
          </div>

          {/* Hero Visual Right: Event Lifecycle Pipeline Stepper */}
          <div className="lg:col-span-6 mt-12 lg:mt-0" id="pipeline">
            <div className="relative rounded-3xl border border-slate-800/90 bg-[#090d1e]/90 p-6 md:p-8 shadow-2xl backdrop-blur-2xl">
              <div className="flex items-center justify-between pb-6 border-b border-slate-800/80 mb-6">
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-400" />
                    <span>7-Stage Event Lifecycle Pipeline</span>
                  </h3>
                  <p className="text-xs text-slate-400">Seamless governance flow from submission to automated report</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  LIVE PIPELINE
                </span>
              </div>

              {/* Stepper Flow Container */}
              <div className="relative space-y-5">
                {/* Continuous Vertical Gradient Connecting Line */}
                <div className="absolute left-[23px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-blue-500 via-indigo-500 to-rose-500 opacity-60 z-0" />

                {PIPELINE_STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const isLast = idx === PIPELINE_STEPS.length - 1;
                  return (
                    <div key={step.id} className="relative z-10 flex items-center gap-4 group">
                      {/* Node Icon */}
                      <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${step.border} ${step.bg} bg-slate-950 transition-all duration-300 group-hover:scale-110 group-hover:border-blue-400 shadow-md`}>
                        <Icon className={`h-5 w-5 ${step.color}`} />

                        {/* Downward Flow Arrow Symbol on Connecting Line */}
                        {!isLast && (
                          <div
                            className="absolute left-1/2 top-[calc(100%+16px)] -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center pointer-events-none"
                            aria-hidden="true"
                          >
                            <div className={`flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#090d1e] border ${step.border} shadow-lg transition-all duration-300 group-hover:scale-125 group-hover:border-blue-400 group-hover:shadow-[0_0_10px_rgba(59,130,246,0.6)]`}>
                              <ArrowDown className={`h-2.5 w-2.5 ${step.color} transition-transform group-hover:translate-y-0.5`} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content Box */}
                      <div className="flex-1 flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/60 px-4 py-3 backdrop-blur-md transition-all duration-300 group-hover:border-slate-700 group-hover:bg-slate-800/80">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-semibold uppercase text-slate-500 tracking-wider">
                              STAGE 0{step.id}
                            </span>
                            <h4 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                              {step.label}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
                        </div>
                        <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium ${step.bg} ${step.color} border ${step.border}`}>
                          {step.badge}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 border-t border-slate-800/80 bg-[#030712] relative">
        <div className="container relative mx-auto px-6 md:px-12">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Everything You Need to Run Impactful Events
            </h2>
            <p className="mt-4 text-base text-slate-400">
              A complete suite of modules for managing hackathons, proposals, approvals, live scoring, and digital credentials.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Hackathon Proposals", icon: FileText, desc: "Submit, review, and track proposal approvals seamlessly.", tag: "Workflow" },
              { title: "Manager & Principal Sign-off", icon: Shield, desc: "Multi-level organizational review and approval chain.", tag: "Governance" },
              { title: "Live QR Gate Scanner", icon: Target, desc: "Real-time attendance check-in for physical & hybrid gates.", tag: "Attendance" },
              { title: "Socket Live Leaderboard", icon: Trophy, desc: "Broadcast live hackathon team scores & judge progress.", tag: "Real-time" },
              { title: "Granular RBAC Security", icon: Lock, desc: "Field-level data privacy, temporary delegation, and TOTP 2FA.", tag: "Security" },
              { title: "Multi-Channel Broadcast", icon: Bell, desc: "In-App, Email, WhatsApp, and Push Notification drawer.", tag: "Outreach" },
              { title: "Digital Badges & Certificates", icon: Award, desc: "Issue, verify, and revoke digital accomplishment credentials.", tag: "Credentials" },
              { title: "Immutable Audit Export", icon: BarChart, desc: "Compliance audit log trail with CSV & JSON exports.", tag: "Compliance" },
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:bg-slate-900/80 hover:shadow-xl hover:shadow-blue-500/10"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-blue-400 border border-slate-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {feature.tag}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-[#070b19] border-t border-slate-800/80">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              From Concept to Certified Execution
            </h2>
            <p className="mt-4 text-base text-slate-400">
              Structured step-by-step pipeline ensuring accountability and clear communication.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {[
              { num: "01", title: "Submit Proposal", desc: "Student Coordinator drafts and submits an event proposal with budget & objectives." },
              { num: "02", title: "Manager Evaluation", desc: "Program Office Manager reviews proposal details and submits recommendation." },
              { num: "03", title: "Principal Sign-off", desc: "Institutional Administrator grants formal approval to initiate event setup." },
              { num: "04", title: "Event & Team Setup", desc: "Configure competition rules, teams, mentors, and participant registration limits." },
              { num: "05", title: "Coordinator Delegation", desc: "Assign lead Faculty and Student Coordinators to manage logistics and entry." },
              { num: "06", title: "Live Execution & Scoring", desc: "Scan attendance QR codes, review team submissions, and compute live scores." },
              { num: "07", title: "AI Report & Certificate Issuance", desc: "Generate structured final reports, export audit logs, and issue digital badges." },
            ].map((step, i) => (
              <div
                key={i}
                className="flex items-center gap-6 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 backdrop-blur-md transition-all duration-300 hover:border-slate-700 hover:bg-slate-800/70"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20 font-mono text-lg font-bold">
                  {step.num}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white text-base">{step.title}</h4>
                  <p className="text-sm text-slate-400 mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role-Based Section */}
      <section id="roles" className="py-24 border-t border-slate-800/80 bg-[#030712] relative">
        <div className="container relative mx-auto px-6 md:px-12">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Tailored Experiences for Every Role
            </h2>
            <p className="mt-4 text-base text-slate-400">
              Role-based access control guarantees each user sees only what they are authorized to manage.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                role: "Student Coordinator",
                icon: Target,
                color: "text-blue-400",
                bg: "bg-blue-500/10",
                border: "border-blue-500/20",
                tasks: ["Draft & submit proposals", "Manage assigned events", "Scan QR attendance", "Prepare final AI reports"],
              },
              {
                role: "Event Manager",
                icon: LayoutDashboard,
                color: "text-indigo-400",
                bg: "bg-indigo-500/10",
                border: "border-indigo-500/20",
                tasks: ["Review proposal submissions", "Create approved events", "Assign event coordinators", "Track operational metrics"],
              },
              {
                role: "Principal / Admin",
                icon: Shield,
                color: "text-emerald-400",
                bg: "bg-emerald-500/10",
                border: "border-emerald-500/20",
                tasks: ["Final principal approval", "Manage organization roles", "Enforce MFA/2FA security", "Export compliance audit logs"],
              },
              {
                role: "Evaluator & Judge",
                icon: CheckCircle2,
                color: "text-amber-400",
                bg: "bg-amber-500/10",
                border: "border-amber-500/20",
                tasks: ["Review hackathon entries", "Submit evaluation scores", "Finalize competition winners"],
              },
              {
                role: "Participant / Hacker",
                icon: Trophy,
                color: "text-purple-400",
                bg: "bg-purple-500/10",
                border: "border-purple-500/20",
                tasks: ["Register for events", "Form hackathon teams", "View live leaderboards", "Claim digital certificates"],
              },
            ].map((roleItem, i) => (
              <div
                key={i}
                className="flex flex-col rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur-md transition-all duration-300 hover:border-slate-700 hover:shadow-xl"
              >
                <div className="mb-6 flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${roleItem.bg} ${roleItem.color} ${roleItem.border} border`}>
                    <roleItem.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{roleItem.role}</h3>
                </div>
                <ul className="flex-1 space-y-2.5">
                  {roleItem.tasks.map((task, j) => (
                    <li key={j} className="flex items-center gap-2.5 text-xs text-slate-400">
                      <CheckCircle2 className={`h-4 w-4 shrink-0 ${roleItem.color}`} />
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#070b19] border-t border-slate-800/80 relative overflow-hidden">
        <div className="container relative mx-auto px-6 text-center md:px-12">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Ready to Run Your Next Event with Eventora?
          </h2>
          <p className="mt-4 text-base text-slate-400 mb-10 max-w-2xl mx-auto">
            Unify proposals, approvals, registrations, evaluations, and compliance reporting in one single platform.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            {isAuthenticated ? (
              <Button asChild size="lg" className="h-14 rounded-full bg-blue-600 px-8 text-base font-bold text-white shadow-xl shadow-blue-600/30 hover:bg-blue-500">
                <Link to={dashboardUrl}>Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="h-14 rounded-full bg-blue-600 px-8 text-base font-bold text-white shadow-xl shadow-blue-600/30 hover:bg-blue-500">
                  <Link to="/signup">Participant Register</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-14 rounded-full border-slate-700 bg-slate-900/60 px-8 text-base font-bold text-white hover:bg-slate-800">
                  <Link to="/login">Sign In</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#030712] border-t border-slate-800/80 py-12">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid gap-8 md:grid-cols-4 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <div className="mb-4">
                <ClienturaLogo size="md" variant="dark" />
              </div>
              <p className="text-xs text-slate-400 mb-6 max-w-xs leading-relaxed">
                Enterprise Event & Hackathon Management Console. Powered by Clientura Platform.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">Quick Links</h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li><a href="#" className="hover:text-blue-400 transition-colors">Home</a></li>
                <li><a href="#features" className="hover:text-blue-400 transition-colors">Features</a></li>
                <li><a href="#pipeline" className="hover:text-blue-400 transition-colors">Event Pipeline</a></li>
                <li><a href="#roles" className="hover:text-blue-400 transition-colors">Roles</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">Account & Access</h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li><Link to="/login" className="hover:text-blue-400 transition-colors">Sign In</Link></li>
                <li><Link to="/signup" className="hover:text-blue-400 transition-colors">Participant Register</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              © 2026 Eventora powered by Clientura. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
